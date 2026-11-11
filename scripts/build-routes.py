"""Recorrido georreferenciado de cada zona de recolección.

Lee los Excel de ruteo (data/Anexo III y IV), ubica cada esquina con las calles de
OpenStreetMap que caen dentro del polígono de la zona (KMZ) y escribe
data/routes/<turno>-<zona>.json con el trazado tramo a tramo.

Uso:
  python -I scripts/build-routes.py                      # todas las zonas
  python -I scripts/build-routes.py --shift nocturno --zone 1
"""

import argparse
import heapq
import json
import math
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from difflib import SequenceMatcher
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
OUT = DATA / 'routes'
OSM_CACHE = DATA / 'osm' / 'corrientes-calles-todas.json'
KMZ = DATA / 'Zonas de Recoleccion (oscar).kmz'
ALIASES = Path(__file__).resolve().parent / 'street-aliases.json'
GEOREF = 'https://apis.datos.gob.ar/georef/api/direcciones'
GEOREF_CACHE = DATA / 'osm' / 'georef-esquinas.json'
# Una esquina de Georef se acepta si cae a menos de esto de un nodo de calle de OSM.
GEOREF_SNAP_M = 150
EXCEL = {
    'diurno': (DATA / 'Anexo III - Plan de trabajo ruteo mañana.xlsx', 'D'),
    'nocturno': (DATA / 'Anexo IV - Plan de trabajo ruteo nocturno.xlsx', 'N'),
}

# Ciudad de Corrientes (sur, oeste, norte, este).
BBOX = (-27.62, -58.92, -27.38, -58.66)
OVERPASS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
# Margen alrededor del polígono. Las calles del borde quedan sobre la línea, y los recorridos del Excel
# (2021) se pasan del polígono del KMZ (rezonificado): la Zona 1 nocturna llega ~400 m más allá.
ZONE_BUFFER_M = 800
# Si dos calles no comparten nodo en OSM (pasaje que muere a mitad de cuadra, cruce mal dibujado),
# se acepta la esquina cuando una pasa a menos de esto de la otra.
NEAR_CROSSING_M = 80
# Elección entre calles candidatas: una coincidencia por palabras pesa como esta distancia por palabra de más,
# y saltar a otra calle pesa varias veces lo que se recorre (el camión sigue por donde venía).
MATCH_PENALTY_M = 30
# Calles transitables (sin peatonales, ciclovías ni accesos internos).
ROAD_TYPES = '^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|road|track)(_link)?$'
# Desvío máximo para considerar que una cuadra sin nombre continúa la calle anterior.
CONTINUATION_DEG = 25
# Hasta cuánto se extiende una calle por cuadras que la continúan con otro nombre en OSM.
CONTINUATION_MAX_M = 1000
# Distancia máxima entre dos calles que no se cruzan para tomar el tramo "hasta la altura de" la otra.
AT_HEIGHT_MAX_M = 300
JUMP_WEIGHT = 3

END_OF_ROUTE = re.compile(r'disposici|base oper|predio', re.I)
PREFIXES = {
    'av', 'avda', 'avenida', 'calle', 'pje', 'pasaje', 'psje', 'dr', 'dra', 'doctor', 'gral', 'general',
    'gdor', 'gobernador', 'pte', 'presidente', 'cnel', 'coronel', 'sgto', 'sargento', 'tte', 'teniente',
    'cte', 'cmte', 'comandante', 'pbro', 'ing', 'prof', 'vicegobernador', 'prolong', 'prolongacion',
}
STOPWORDS = {'de', 'la', 'del', 'los', 'las', 'y', 'el'}


# ---------- utilidades ----------

def normalize(name: str) -> str:
    s = unicodedata.normalize('NFKD', str(name)).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9 ]', ' ', s).split())


ROAD_ABBREVIATIONS = [
    (r'\bruta nr?o? ?(\d+)', r'ruta \1'),  # "Ruta N°5"
    (r'\brp ?(\d+)', r'ruta provincial \1'),  # "Rp5"
    (r'\brn? ?(\d+)\b', r'ruta nacional \1'),  # "R12"
    (r'\bn?t?ra sra\b', 'nuestra senora'),  # "Ntra Sra", "Nra. Sra"
    (r'\bsta\b', 'santa'),
    (r'\bsto\b', 'santo'),
    (r'\balmte\b', 'almirante'),
]


def tokens(name: str) -> list[str]:
    s = normalize(name)
    for pattern, repl in ROAD_ABBREVIATIONS:
        s = re.sub(pattern, repl, s)
    words = s.split()
    core = [w for w in words if w not in PREFIXES and w not in STOPWORDS]
    return core or words


def token_match(a: str, b: str) -> bool:
    if a == b:
        return True
    if len(a) == 1:
        return b.startswith(a)
    return len(a) >= 4 and len(b) >= 4 and SequenceMatcher(None, a, b).ratio() >= 0.8


def meters(a, b) -> float:
    """Distancia en metros entre (lat, lng)."""
    lat = math.radians((a[0] + b[0]) / 2)
    dx = (b[1] - a[1]) * 111_320 * math.cos(lat)
    dy = (b[0] - a[0]) * 110_540
    return math.hypot(dx, dy)


def point_in_ring(pt, ring) -> bool:
    lat, lng = pt
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > lat) != (y2 > lat) and lng < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def dist_to_segment(pt, a, b) -> float:
    """Distancia en metros de pt al segmento a-b, todo en (lat, lng)."""
    # Proyección en grados: suficiente a escala de ciudad.
    dy, dx = b[0] - a[0], b[1] - a[1]
    t = 0 if dx == dy == 0 else max(0, min(1, ((pt[0] - a[0]) * dy + (pt[1] - a[1]) * dx) / (dx * dx + dy * dy)))
    return meters(pt, (a[0] + t * dy, a[1] + t * dx))


def dist_to_ring(pt, ring) -> float:
    pts = [(lat, lng) for lng, lat in ring]
    return min(dist_to_segment(pt, a, b) for a, b in zip(pts, pts[1:] + pts[:1]))


def in_zone(pt, rings) -> bool:
    return any(point_in_ring(pt, r) for r in rings) or min(dist_to_ring(pt, r) for r in rings) <= ZONE_BUFFER_M


# ---------- fuentes ----------

def load_zones() -> dict:
    """{('nocturno', 1): [anillo exterior en (lng, lat), ...]}"""
    ns = '{http://www.opengis.net/kml/2.2}'
    with zipfile.ZipFile(KMZ) as z:
        root = ET.fromstring(z.read('doc.kml'))
    zones = {}
    for pm in root.iter(ns + 'Placemark'):
        m = re.fullmatch(r'Z(\d+)([DN])', (pm.findtext(ns + 'name') or '').strip().replace('\xa0', ''))
        if not m:
            continue
        shift = 'diurno' if m[2] == 'D' else 'nocturno'
        rings = [
            [tuple(map(float, c.split(',')[:2])) for c in coords.text.split()]
            for outer in pm.iter(ns + 'outerBoundaryIs')
            for coords in outer.iter(ns + 'coordinates')
        ]
        zones.setdefault((shift, int(m[1])), []).extend(rings)
    return zones


def load_osm() -> list[dict]:
    if not OSM_CACHE.exists():
        print('Descargando calles de OpenStreetMap…', file=sys.stderr)
        # También las calles sin nombre: en la periferia muchas cuadras de una calle no tienen el nombre cargado.
        query = f'[out:json][timeout:180];way["highway"~"{ROAD_TYPES}"]{BBOX};out body geom;'
        for url in OVERPASS:  # los servidores públicos a veces devuelven 502/504: se prueba el siguiente
            req = urllib.request.Request(
                url,
                data=urllib.parse.urlencode({'data': query}).encode(),
                headers={'User-Agent': 'muni-limpia-routes/1.0'},
            )
            try:
                with urllib.request.urlopen(req, timeout=240) as r:
                    body = r.read()
                break
            except OSError as e:
                print(f'  {url}: {e}', file=sys.stderr)
        else:
            sys.exit('No se pudo descargar OpenStreetMap.')
        OSM_CACHE.parent.mkdir(parents=True, exist_ok=True)
        OSM_CACHE.write_bytes(body)
    ways = []
    for el in json.loads(OSM_CACHE.read_text(encoding='utf-8'))['elements']:
        tags = el.get('tags', {})
        names = {tags[k] for k in ('name', 'alt_name', 'old_name', 'official_name', 'short_name') if k in tags}
        ways.append({
            'id': el['id'],
            'names': names,
            'nodes': el['nodes'],
            'coords': [(g['lat'], g['lon']) for g in el['geometry']],
        })
    propagate_names(ways)
    return ways


def heading(a, b) -> float:
    return math.degrees(math.atan2((b[1] - a[1]) * math.cos(math.radians(a[0])), b[0] - a[0]))


def propagate_names(ways: list[dict]):
    """Enlaza cada way con las que la continúan en línea recta (`next`).

    Una cuadra sin nombre que sigue a una calle con nombre se toma como parte de esa calle.
    """
    ends = {}
    for w in ways:
        w['next'] = []
        ends.setdefault(w['nodes'][0], []).append(w)
        ends.setdefault(w['nodes'][-1], []).append(w)

    def outward(w, node):
        """Rumbo con el que la way sale por `node` (hacia afuera de ella)."""
        c = w['coords']
        return heading(c[1], c[0]) if w['nodes'][0] == node else heading(c[-2], c[-1])

    for w in ways:
        for node in {w['nodes'][0], w['nodes'][-1]}:
            out = outward(w, node)
            for other in ends.get(node, []):
                # La continuación entra por `node` con el rumbo opuesto al de su propia salida.
                into = (outward(other, node) + 180) % 360
                if other is not w and abs((into - out + 180) % 360 - 180) <= CONTINUATION_DEG:
                    w['next'].append(other)

    queue = [w for w in ways if w['names']]
    while queue:
        w = queue.pop()
        for other in w['next']:
            if not other['names']:
                other['names'] = set(w['names'])
                other['inferred'] = True
                queue.append(other)


def load_routes(shift: str) -> list[dict]:
    """Cada hoja del Excel: resumen de km y la secuencia de tramos (calle, hasta calle)."""
    path, _ = EXCEL[shift]
    wb = openpyxl.load_workbook(path, data_only=True)
    routes = []
    for ws in wb:
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        zone = int(re.search(r'\d+', ws.title)[0])

        # Los encabezados no están siempre en la misma fila ni columna: se ubican por contenido.
        head = next(i for i, r in enumerate(rows) if any(isinstance(c, str) and c.strip().lower() == 'tipo' for c in r))
        hrow = [str(c).strip().lower() if c is not None else '' for c in rows[head]]
        if 'calle a recorrer' in hrow:
            col, first = hrow.index('calle a recorrer'), head + 1
        else:  # Zona 16 diurno: el primer tramo ocupa la fila de encabezados.
            col, first = hrow.index('inicio') + 1, head

        summary = next(r for r in reversed(rows[:head]) if any(isinstance(c, (int, float)) for c in r[1:]))
        km = [c for c in summary[1:] if isinstance(c, (int, float))]
        texts = [c for c in summary if isinstance(c, str) and not re.match(r'zona', c, re.I)]
        start_text = rows[head + 1][col - 1] if col >= 1 else None

        segments = []
        for r in rows[first:]:
            street, to = r[col], r[col + 1] if col + 1 < len(r) else None
            if not street and not to:
                continue
            street, to = str(street or '').strip(), str(to or '').strip()
            if END_OF_ROUTE.search(street) or END_OF_ROUTE.search(to):
                break
            # A veces un tramo quedó partido en dos filas: la calle en una y "hasta" en la siguiente.
            if not street and segments and not segments[-1][1]:
                segments[-1] = (segments[-1][0], to)
                continue
            segments.append((street, to))

        routes.append({
            'zone': zone,
            'start': texts[0] if texts else None,
            'end': texts[1] if len(texts) > 1 else None,
            'firstCorner': start_text if isinstance(start_text, str) else None,
            'km': dict(zip(['baseToZone', 'zone', 'zoneToDisposal', 'disposalToBase'], km[:4])),
            'segments': segments,
        })
    return routes


# ---------- geocodificación de una zona ----------

class ZoneStreets:
    def __init__(self, ways: list[dict], rings, aliases: list[dict]):
        self.aliases = {}
        for k, v in (item for group in aliases for item in group.items()):
            if not k.startswith('_'):
                self.aliases.setdefault(' '.join(tokens(k)), []).extend(v)
        self.coord = {}  # nodo -> (lat, lng)
        self.ways = []
        for w in ways:
            keep = [i for i, c in enumerate(w['coords']) if in_zone(c, rings)]
            if not keep:
                continue
            self.ways.append(w)
            for n, c in zip(w['nodes'], w['coords']):
                self.coord[n] = c
        self.names = {}
        for w in self.ways:
            for name in w['names']:
                self.names.setdefault(name, []).append(w)
        self.way_ids = {id(w) for w in self.ways}
        self.inside = {n for n, c in self.coord.items() if in_zone(c, rings)}
        self._cache = {}

    def candidates(self, name: str) -> list[tuple[float, list]]:
        """Calles de OSM que pueden ser la del Excel, como (penalidad en metros, ways).

        Exacta sin penalidad; por palabras ("De la Vega" → "Garcilazo de la Vega" y "Blas Benjamín de la Vega")
        penalizada por cada palabra de más. Entre varias, decide la esquina más cercana al recorrido.
        """
        if name in self._cache:
            return self._cache[name]
        want = tokens(name)
        # Variantes de un mismo nombre en OSM ("Turin" / "Turín") son la misma calle.
        groups = {}
        for osm_name, ways in self.names.items():
            groups.setdefault(tuple(tokens(osm_name)), []).extend(ways)
        found = []
        for have, ways in groups.items() if want else []:
            if list(have) == want:
                found.append((0, ways))
            elif all(any(token_match(a, b) for b in have) for a in want):
                found.append((MATCH_PENALTY_M * (1 + len(have) - len(want)), ways))
        # Correcciones manuales: la misma calle cambia de nombre en un tramo (San Martín → Padre Lavagna).
        extra = [w for n in self.aliases.get(' '.join(want), []) for w in self.names.get(n, [])]
        if extra:
            found = [(p, ways + extra) for p, ways in found] or [(0, extra)]
        self._cache[name] = found
        return found

    def extend(self, ways: list) -> list:
        """Suma las cuadras que siguen en línea recta aunque OSM les cambie el nombre
        (Lisandro Segovia sigue como "Padre Julio" al sur de Tte. Ibáñez; Google la llama igual)."""
        out = {id(w): w for w in ways}
        frontier = [(w, 0.0) for w in ways]
        while frontier:
            w, added = frontier.pop()
            for nxt in w['next']:
                length = length_km(nxt['coords']) * 1000
                if id(nxt) in out or id(nxt) not in self.way_ids or added + length > CONTINUATION_MAX_M:
                    continue
                out[id(nxt)] = nxt
                frontier.append((nxt, added + length))
        return list(out.values())

    def match(self, name: str) -> list[dict]:
        """Todas las ways candidatas, sin distinguir."""
        return list({id(w): w for _, ways in self.candidates(name) for w in ways}.values())

    def best_corner(self, street: str, to: str, cur=None):
        """(start, end, ways) del tramo: la combinación de candidatas que sigue mejor desde `cur`.

        Primero con las calles tal como están en OSM; si no hay esquina, con sus continuaciones en línea recta;
        y si tampoco, "a la altura de": el Excel dice "hasta Neuquén" donde Neuquén termina antes (verificado en
        Google Maps), así que se toma el punto de la calle más cercano a la otra.
        """
        for kind, extended, gap in [('esquina', False, NEAR_CROSSING_M), ('continuacion', True, NEAR_CROSSING_M),
                                    ('altura', True, AT_HEIGHT_MAX_M)]:
            found = self._best_corner(street, to, cur, extended, gap)
            if found:
                return (*found, kind)
        return None

    def _best_corner(self, street: str, to: str, cur, extended: bool, gap: float):
        best, best_score = None, math.inf
        for s_pen, s_core in self.candidates(street):
            s_ways = self.extend(s_core) if extended else s_core
            s_nodes = self.nodes_of(s_ways)
            if not s_nodes:
                continue
            if cur is None or cur in s_nodes:
                start, jump = cur, 0
            else:  # el Excel salta a otra calle: arranca desde su punto más cercano
                start = self.nearest_node(s_ways, self.coord[cur])
                jump = meters(self.coord[cur], self.coord[start])
            s_ids = {id(w) for w in s_core}
            for t_pen, t_ways in self.candidates(to):
                if s_ids & {id(w) for w in t_ways}:
                    continue  # la misma calle no es esquina de sí misma
                end = self.crossing(s_ways, t_ways, near=self.coord[start] if start else None, avoid=start, gap=gap)
                if end is None:
                    continue
                run = meters(self.coord[start], self.coord[end]) if start else 0
                score = JUMP_WEIGHT * jump + run + s_pen + t_pen
                if score < best_score:
                    best, best_score = (start if start is not None else end, end, s_ways), score
        return best

    def nodes_of(self, ways) -> set:
        return {n for w in ways for n in w['nodes'] if n in self.inside}

    def crossing(self, a: list, b: list, near=None, avoid=None, gap=NEAR_CROSSING_M):
        """Nodo donde se cruzan dos calles, el más cercano a `near`."""
        shared = self.nodes_of(a) & self.nodes_of(b)
        if avoid in shared and len(shared) > 1:
            shared.discard(avoid)
        if shared:
            return min(shared, key=lambda n: meters(self.coord[n], near) if near else 0)
        # Sin nodo compartido: el nodo de `a` que queda más cerca de la línea de `b`.
        b_lines = [w['coords'] for w in b]
        best, best_d = None, gap
        for na in self.nodes_of(a):
            d = min(dist_to_segment(self.coord[na], p, q) for line in b_lines for p, q in zip(line, line[1:]))
            if d < best_d:
                best, best_d = na, d
        return best

    def snap(self, point):
        """Nodo de calle de la zona más cercano a un punto externo (Georef), si está cerca."""
        best = min(self.inside, key=lambda n: meters(self.coord[n], point), default=None)
        return best if best is not None and meters(self.coord[best], point) <= GEOREF_SNAP_M else None

    def nearest_node(self, ways, point):
        nodes = self.nodes_of(ways)
        return min(nodes, key=lambda n: meters(self.coord[n], point)) if nodes else None

    def path(self, ways, src, dst) -> list:
        """Camino más corto de src a dst usando solo la calle del tramo."""
        if src == dst:
            return [self.coord[src]]
        graph = {}
        for w in ways:
            for u, v in zip(w['nodes'], w['nodes'][1:]):
                d = meters(self.coord[u], self.coord[v])
                graph.setdefault(u, []).append((v, d))
                graph.setdefault(v, []).append((u, d))
        dist, prev, queue = {src: 0}, {}, [(0, src)]
        while queue:
            d, u = heapq.heappop(queue)
            if u == dst:
                break
            if d > dist.get(u, math.inf):
                continue
            for v, w in graph.get(u, []):
                if d + w < dist.get(v, math.inf):
                    dist[v], prev[v] = d + w, u
                    heapq.heappush(queue, (d + w, v))
        if dst not in dist:
            return [self.coord[src], self.coord[dst]]
        out, n = [dst], dst
        while n != src:
            n = prev[n]
            out.append(n)
        return [self.coord[n] for n in reversed(out)]


def length_km(line) -> float:
    return sum(meters(a, b) for a, b in zip(line, line[1:])) / 1000


class Georef:
    """Esquinas según la API Georef (registro oficial de calles del INDEC), con caché en disco."""

    def __init__(self):
        self.cache = json.loads(GEOREF_CACHE.read_text(encoding='utf-8')) if GEOREF_CACHE.exists() else {}

    def corner(self, a: str, b: str):
        key = f'{a} y {b}'
        if key not in self.cache:
            query = urllib.parse.urlencode({'direccion': key, 'provincia': 'Corrientes', 'departamento': 'Capital', 'max': 1})
            try:
                with urllib.request.urlopen(f'{GEOREF}?{query}', timeout=30) as r:
                    found = json.load(r).get('direcciones') or []
            except OSError as e:
                print(f'  Georef {key}: {e}', file=sys.stderr)
                return None
            self.cache[key] = [found[0]['ubicacion']['lat'], found[0]['ubicacion']['lon']] if found else None
            time.sleep(0.2)
        return self.cache[key]

    def save(self):
        GEOREF_CACHE.write_text(json.dumps(self.cache, ensure_ascii=False, indent=0), encoding='utf-8')


def geocode_route(route: dict, streets: ZoneStreets, georef: Georef) -> dict:
    segments = []
    cur = None  # nodo donde quedó el camión
    if route['firstCorner'] and ' y ' in route['firstCorner'].lower():
        a, b = re.split(r'\s+y\s+', route['firstCorner'], maxsplit=1, flags=re.I)
        first = streets.best_corner(a, b)
        cur = first[1] if first else None

    acc = 0.0
    for i, (street, to) in enumerate(route['segments'], start=1):
        seg = {'order': i, 'street': street, 'to': to}
        ways = streets.match(street)

        # El tramo arranca donde terminó el anterior (sin esquina de inicio, el primero queda como punto).
        corner = streets.best_corner(street, to, cur) if ways and streets.match(to) else None
        if corner is None:
            # Calles que OSM no tiene (numeradas, barrios nuevos): la esquina según el registro oficial (Georef).
            point = georef.corner(street, to) if street and to else None
            end = streets.snap(point) if point else None
            if end is not None and end != cur:
                start = cur if cur is not None else end
                on_street = ways and {start, end} <= streets.nodes_of(ways)
                line = streets.path(ways, start, end) if on_street else [streets.coord[start], streets.coord[end]]
                corner = (start, end, ways if on_street else [], 'georef', line)
        elif corner:
            corner = (*corner, streets.path(corner[2], corner[0], corner[1]))

        if corner is None:
            if not ways:
                seg['status'] = 'calle-no-encontrada'
            else:
                seg['status'] = 'esquina-no-encontrada'
                seg['missing'] = f'{street} y {to}' if streets.match(to) else to
        else:
            start, end, used, kind, line = corner
            km = length_km(line)
            acc += km
            seg.update({
                'status': 'ok',
                'corner': kind,
                'osmStreet': sorted({n for w in used for n in w['names']}),
                'from': [round(c, 6) for c in streets.coord[start]],
                'toPoint': [round(c, 6) for c in streets.coord[end]],
                'km': round(km, 3),
                'kmAccum': round(acc, 3),
                'path': [[round(lat, 6), round(lng, 6)] for lat, lng in line],
            })
            cur = end
        segments.append(seg)

    located = sum(s['status'] == 'ok' for s in segments)
    return {
        'zone': route['zone'],
        'start': route['start'],
        'end': route['end'],
        'km': route['km'],
        'kmComputed': round(acc, 2),
        'segmentsTotal': len(segments),
        'segmentsLocated': located,
        'locatedPct': round(100 * located / len(segments), 1) if segments else 0,
        'segments': segments,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--shift', choices=list(EXCEL))
    parser.add_argument('--zone', type=int)
    args = parser.parse_args()

    zones = load_zones()
    ways = load_osm()
    aliases = json.loads(ALIASES.read_text(encoding='utf-8'))
    georef = Georef()
    OUT.mkdir(exist_ok=True)

    for shift in [args.shift] if args.shift else list(EXCEL):
        for route in load_routes(shift):
            if args.zone and route['zone'] != args.zone:
                continue
            rings = zones.get((shift, route['zone']))
            if not rings:
                print(f'{shift} {route["zone"]}: sin polígono en el KMZ', file=sys.stderr)
                continue
            streets = ZoneStreets(ways, rings, [aliases['*'], aliases.get(f'{shift}-{route["zone"]}', {})])
            result = {'shift': shift, **geocode_route(route, streets, georef)}
            georef.save()
            out = OUT / f'{shift}-{route["zone"]:02d}.json'
            out.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding='utf-8')

            missing = sorted({s.get('missing') or s['street'] for s in result['segments'] if s['status'] != 'ok'})
            print(
                f'{shift} zona {route["zone"]:>2}: {result["segmentsLocated"]}/{result["segmentsTotal"]} tramos '
                f'({result["locatedPct"]}%) · {result["kmComputed"]} km trazados vs {route["km"].get("zone")} km del Excel'
            )
            if missing:
                print('   sin ubicar:', ', '.join(missing))


if __name__ == '__main__':
    main()
