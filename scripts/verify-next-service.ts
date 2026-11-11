import assert from 'node:assert/strict';
import { nextService } from '../src/data/schedule.ts';
import type { ZoneLocation } from '../src/types.ts';

const zone = (over: Partial<ZoneLocation>) => ({ type: 'Residuos Comunes', ...over }) as ZoneLocation;

// 2026-09-30 es miércoles. Hora de Corrientes (UTC−3), así pasa con cualquier TZ del equipo.
const wed = (h: number, m: number) => new Date(Date.UTC(2026, 8, 30, h + 3, m));

const lmv = zone({ days: [1, 3, 5], start: '20:00', end: '22:00' });
const night = zone({ days: [0, 1, 2, 3, 4, 5, 6], start: '22:00', end: '02:00' });
const green = zone({ type: 'Punto Verde', days: [1, 2, 3, 4, 5], start: '08:00', end: '16:00' });
const greenTue = zone({ type: 'Punto Verde', days: [4], start: '08:00', end: '16:00' });

const cases: [string, () => void][] = [
  ['antes de la ventana (mié 17:15)', () => {
    const r = nextService(lmv, wed(17, 15));
    assert.equal(r.state, 'hoy');
    assert.equal(r.startsInMin, 165);
    assert.equal(r.label, 'Pasa en 2 h 45 min');
  }],
  ['durante la ventana (mié 21:00)', () => {
    const r = nextService(lmv, wed(21, 0));
    assert.equal(r.state, 'en-curso');
    assert.equal(r.startsInMin, 0);
    assert.equal(r.label, 'En curso');
  }],
  ['después de la ventana (mié 22:30)', () => {
    const r = nextService(lmv, wed(22, 30));
    assert.equal(r.state, 'proximo');
    assert.equal(r.label, 'Viernes 20:00');
  }],
  ['cruza medianoche (01:00)', () => {
    const r = nextService(night, wed(1, 0));
    assert.equal(r.state, 'en-curso');
    assert.equal(r.startsInMin, 0);
  }],
  ['Punto Verde abierto', () => {
    const r = nextService(green, wed(10, 0));
    assert.equal(r.state, 'en-curso');
    assert.equal(r.label, 'Abierto ahora');
    assert.equal(r.openNow, true);
    assert.equal(r.closesAt, '16:00');
  }],
  ['Punto Verde abre hoy', () => {
    const r = nextService(green, wed(6, 0));
    assert.equal(r.label, 'Abre hoy 08:00');
    assert.equal(r.openNow, false);
  }],
  ['día siguiente -> "Mañana HH:MM"', () => {
    const r = nextService(greenTue, wed(12, 0));
    assert.equal(r.state, 'proximo');
    assert.equal(r.label, 'Abre mañana 08:00');
    const c = nextService(zone({ days: [4], start: '06:00', end: '08:00' }), wed(12, 0));
    assert.equal(c.label, 'Mañana 06:00');
  }],
];

let failed = 0;
for (const [name, fn] of cases) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}\n${(e as Error).message}`);
  }
}
if (failed) {
  console.log(`${failed} caso(s) fallaron`);
  process.exit(1);
}
console.log(`${cases.length} casos OK`);
