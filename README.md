# Muni Limpia

Prototipo (demo) de la app de recolección de residuos de la Municipalidad de Corrientes: mapa de zonas, horarios con el próximo paso del camión, recorrido y reporte de problemas. React 19 + Vite 6 + Tailwind 4 + Leaflet.

> La app usa **datos de ejemplo** escritos a mano en `src/data/` (`corrientesData.ts`, `schedule.ts`, `reports.ts`). Los datos reales (planes de trabajo del municipio y SmartMovePro) todavía no están conectados: están en `data/`, que no se versiona (ver más abajo).

## Levantarlo en local

Requisitos: **Node 22** o superior (npm incluido).

```bash
npm ci
npm run dev        # http://localhost:3000
```

**No hace falta ninguna variable de entorno.** El `.env` que pueda aparecer es un resto de Google AI Studio (`GEMINI_API_KEY`, `APP_URL`); el código no lo lee.

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build |
| `npm run lint` | Chequeo de tipos (`tsc --noEmit`) |
| `npm run verify:schedule` | Casos de prueba del cálculo del próximo servicio |

## Estructura

```
src/
  App.tsx                 navegación entre pantallas y estado global
  components/             pantallas (Inicio, Mapa, Horarios, Reportar) y modales
  data/                   datos de ejemplo y lógica de horarios (hora de Corrientes)
  lib/, services/         utilidades y descarga de comprobantes
scripts/                  herramientas de datos (no forman parte de la app)
data/                     datos crudos, fuera de git (se comparten por Drive)
docs/                     documentación de los datos
```

## Datos (`data/`, fuera de git)

Pesan ~480 MB y se comparten por Drive. Para usarlos con los scripts, descomprimirlos en `data/` respetando esta estructura:

| Carpeta | Origen | Contenido |
| --- | --- | --- |
| `Anexo III/IV - Plan de trabajo ruteo *.xlsx`, `PLAN DE TRABAJO AJUSTADO….pdf`, `DIURNO/`, `NOCTURNO/`, `Zonas de Recoleccion (oscar).kmz` | Municipio | Plan de trabajo: zonas, recorridos esquina a esquina y polígonos |
| `osm/` | OpenStreetMap / Georef | Calles de Corrientes para georreferenciar los recorridos |
| `routes/` | `scripts/build-routes.py` | Recorrido trazado calle por calle de cada zona (16 diurnas, 15 nocturnas) |
| `smartmove/catalogos/` | SmartMovePro | Vehículos, zonas, contenedores, recorridos planificados, tipos de alerta |
| `smartmove/servicios/` | SmartMovePro | Grilla diaria de servicios (medias vueltas), un CSV por día desde 25/05/2025 |
| `smartmove/historico/` | SmartMovePro | GPS real de cada camión por día (`.csv.gz`) |

El diccionario de datos y lo que muestran está en el Drive (`datos/smartmove-datos.pdf`): no se versiona porque el repo es público y los datos traen nombres y legajos.

## Scripts de datos

- `scripts/build-routes.py` — genera `data/routes/` a partir de los Anexos, el KMZ y las calles de OSM. Requiere Python 3 y `pip install openpyxl`. Uso: `python -I scripts/build-routes.py [--shift nocturno --zone 1]`.
- Los scripts que descargan de SmartMovePro (`smartmove-puente.mjs` y `smartmove-historico.mjs`) están en el Drive (`scripts/`), no en este repo público. Se copian a `scripts/` para usarlos.
