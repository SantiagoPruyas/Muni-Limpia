import React, { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { FilterCategory, ZoneFilters } from '../types';
import { NEIGHBORHOODS_CORRIENTES } from '../data/corrientesData';
import { categoryMeta } from '../lib/categoryMeta';
import { Modal } from './Modal';

interface FilterModalProps {
  onClose: () => void;
  onApplyFilters: (filters: ZoneFilters) => void;
  /** Filtro actual de App: el modal arranca preseleccionado con él. */
  filters: ZoneFilters;
  /** Cuántas zonas quedan con un filtro dado, para el contador en vivo. */
  countResults: (filters: ZoneFilters) => number;
}

const CATEGORY_OPTIONS: FilterCategory[] = ['todos', 'residuos-comunes', 'reciclables', 'poda-escombros'];
const SHIFT_OPTIONS: ZoneFilters['shift'][] = ['todos', 'Matutino', 'Vespertino', 'Nocturno'];

const optionClass = (selected: boolean) =>
  `h-12 px-3 rounded-control border text-sm font-semibold text-left transition-colors flex items-center gap-2 ${
    selected ? 'border-brand-500 bg-brand-soft text-brand-600' : 'border-line bg-surface-card text-ink-body hover:border-line-strong'
  }`;

export const FilterModal: React.FC<FilterModalProps> = ({ onClose, onApplyFilters, filters, countResults }) => {
  const [draft, setDraft] = useState<ZoneFilters>(filters);
  const resultCount = countResults(draft);

  const handleApply = (close: () => void) => {
    onApplyFilters(draft);
    close();
  };

  return (
    <Modal
      variant="sheet"
      id="modal-filters"
      labelledBy="modal-filters-title"
      onClose={onClose}
      className="max-w-md max-h-[90dvh]"
    >
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-brand-600" />
              <h2 id="modal-filters-title" className="font-display text-lg font-bold text-ink">
                Filtros
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="w-11 h-11 -mr-2 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Options */}
          <div className="p-5 overflow-y-auto flex flex-col gap-5">
            <div role="group" aria-labelledby="filter-category-title" className="flex flex-col gap-2">
              <span id="filter-category-title" className="text-sm font-semibold text-ink">
                Tipo de servicio
              </span>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map((c) => {
                  const { label, Icon } = categoryMeta[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={draft.category === c}
                      onClick={() => setDraft((prev) => ({ ...prev, category: c }))}
                      className={optionClass(draft.category === c)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div role="group" aria-labelledby="filter-shift-title" className="flex flex-col gap-2">
              <span id="filter-shift-title" className="text-sm font-semibold text-ink">
                Turno
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SHIFT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={draft.shift === s}
                    onClick={() => setDraft((prev) => ({ ...prev, shift: s }))}
                    className={optionClass(draft.shift === s)}
                  >
                    {s === 'todos' ? 'Todos' : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="filter-neighborhood" className="text-sm font-semibold text-ink">
                Barrio
              </label>
              <select
                id="filter-neighborhood"
                value={draft.neighborhood}
                onChange={(e) => setDraft((prev) => ({ ...prev, neighborhood: e.target.value }))}
                className="h-12 px-3 bg-surface-card border border-line-strong rounded-control text-base text-ink outline-none focus:border-brand-600"
              >
                <option value="todos">Todos los barrios</option>
                {NEIGHBORHOODS_CORRIENTES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-line bg-surface flex items-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setDraft({ category: 'todos', neighborhood: 'todos', shift: 'todos' })}
              className="px-4 h-12 bg-surface-card hover:bg-surface-muted border border-line rounded-control text-sm font-semibold text-ink-muted"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => handleApply(close)}
              aria-live="polite"
              className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-control text-sm font-semibold tabular-nums"
            >
              {`Ver ${resultCount} ${resultCount === 1 ? 'resultado' : 'resultados'}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
