import React, { useState } from 'react';
import { X, SlidersHorizontal, Trash2, Recycle, Trees, Check } from 'lucide-react';
import { FilterCategory, ZoneFilters } from '../types';
import { NEIGHBORHOODS_CORRIENTES } from '../data/corrientesData';
import { Modal } from './Modal';

interface FilterModalProps {
  onClose: () => void;
  onApplyFilters: (filters: ZoneFilters) => void;
  /** Filtro actual de App: el modal arranca preseleccionado con él. */
  filters: ZoneFilters;
}

const SHIFT_OPTIONS: ZoneFilters['shift'][] = ['todos', 'Matutino', 'Vespertino', 'Nocturno'];

export const FilterModal: React.FC<FilterModalProps> = ({
  onClose,
  onApplyFilters,
  filters,
}) => {
  const [category, setCategory] = useState<FilterCategory>(filters.category);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(filters.neighborhood);
  const [selectedShift, setSelectedShift] = useState<ZoneFilters['shift']>(filters.shift);

  const handleApply = (close: () => void) => {
    onApplyFilters({ category, neighborhood: selectedNeighborhood, shift: selectedShift });
    close();
  };

  const handleReset = () => {
    setCategory('todos');
    setSelectedNeighborhood('todos');
    setSelectedShift('todos');
  };

  const categoryClass = (value: FilterCategory) =>
    category === value
      ? 'border-brand-500 bg-brand-soft text-brand-600'
      : 'border-line bg-surface-card text-ink';

  return (
    <Modal id="modal-filters" labelledBy="modal-filters-title" onClose={onClose} className="max-w-md max-h-[85vh]">
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-brand-600" />
              <h2 id="modal-filters-title" className="font-display text-base font-bold text-ink">
                Filtros de Búsqueda y Mapa
              </h2>
            </div>
            <button
              onClick={close}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Options */}
          <div className="p-5 overflow-y-auto flex flex-col gap-4">
            {/* Service Category */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                Tipo de Servicio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('todos')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${categoryClass('todos')}`}
                >
                  Todos los servicios
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('residuos-comunes')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${categoryClass('residuos-comunes')}`}
                >
                  <Trash2 className="w-4 h-4" />
                  Residuos Comunes
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('reciclables')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${categoryClass('reciclables')}`}
                >
                  <Recycle className="w-4 h-4" />
                  Reciclables
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('poda-escombros')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${categoryClass('poda-escombros')}`}
                >
                  <Trees className="w-4 h-4" />
                  Poda y Escombros
                </button>
              </div>
            </div>

            {/* Shift */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                Turno de Recolección
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {SHIFT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedShift(s)}
                    className={`py-2 px-3 rounded-xl border transition-all ${
                      selectedShift === s
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-line bg-surface-card text-ink-body'
                    }`}
                  >
                    {s === 'todos' ? 'Todos' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Neighborhood filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                Barrio
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="h-11 px-3 bg-surface border border-line rounded-xl text-xs font-medium text-ink outline-none"
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
          <div className="p-4 border-t border-line bg-surface flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 h-12 bg-surface-card hover:bg-surface-muted border border-line rounded-xl text-xs font-bold text-ink-muted"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => handleApply(close)}
              className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Aplicar Filtros
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
