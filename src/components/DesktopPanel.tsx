import React from 'react';
import { BrandLogo } from './BrandLogo';

// D1: panel lateral solo en escritorio, a la izquierda de la columna de la app (ver lib/layout.ts).
export const DesktopPanel: React.FC = () => (
  <aside
    aria-labelledby="desktop-panel-title"
    className="hidden lg:flex fixed inset-y-0 left-[calc(50%-396px)] w-[280px] items-center z-30"
  >
    <div className="w-full bg-brand-700 text-white rounded-sheet p-7 shadow-elev-2">
      <BrandLogo variant="emblema" tone="blanco" className="w-[220px] h-auto" />
      <h2 id="desktop-panel-title" className="font-display font-bold text-xl mt-7">
        Prototipo · Muni Limpia
      </h2>
      <p className="text-sm text-white/85 mt-2 leading-relaxed">
        Datos de demostración de la Municipalidad de Corrientes. Probá:
      </p>
      <ul className="mt-3 pl-5 list-disc marker:text-brand-accent flex flex-col gap-2 text-sm leading-snug">
        <li>El mapa con el camión en vivo por Junín 1200.</li>
        <li>Los horarios de tu zona, con recordatorio y descarga.</li>
        <li>Un reclamo de punta a punta, con su comprobante.</li>
      </ul>
    </div>
  </aside>
);
