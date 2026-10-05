import React, { useState } from 'react';
import { X, SlidersHorizontal, Trash2, Recycle, Trees, Check } from 'lucide-react';
import { FilterCategory } from '../types';
import { NEIGHBORHOODS_CORRIENTES } from '../data/corrientesData';

interface FilterModalProps {
  onClose: () => void;
  onApplyFilters: (category: FilterCategory, neighborhood: string, shift: string) => void;
  currentCategory: FilterCategory;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  onClose,
  onApplyFilters,
  currentCategory,
}) => {
  const [category, setCategory] = useState<FilterCategory>(currentCategory);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('todos');
  const [selectedShift, setSelectedShift] = useState('todos');

  const handleApply = () => {
    onApplyFilters(category, selectedNeighborhood, selectedShift);
    onClose();
  };

  const handleReset = () => {
    setCategory('todos');
    setSelectedNeighborhood('todos');
    setSelectedShift('todos');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-filters"
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f7fafc]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#006b21]" />
            <h2 className="text-base font-bold text-[#181c1e]">
              Filtros de Búsqueda y Mapa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#ebeef0] flex items-center justify-center text-[#555f71]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Options */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Service Category */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider">
              Tipo de Servicio
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('todos')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  category === 'todos'
                    ? 'border-[#006b21] bg-[#006b21]/10 text-[#006b21]'
                    : 'border-[#e2e8f0] bg-white text-[#181c1e]'
                }`}
              >
                Todos los servicios
              </button>
              <button
                type="button"
                onClick={() => setCategory('residuos-comunes')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                  category === 'residuos-comunes'
                    ? 'border-[#006b21] bg-[#006b21]/10 text-[#006b21]'
                    : 'border-[#e2e8f0] bg-white text-[#181c1e]'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Residuos Comunes
              </button>
              <button
                type="button"
                onClick={() => setCategory('reciclables')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                  category === 'reciclables'
                    ? 'border-[#006b21] bg-[#006b21]/10 text-[#006b21]'
                    : 'border-[#e2e8f0] bg-white text-[#181c1e]'
                }`}
              >
                <Recycle className="w-4 h-4" />
                Reciclables
              </button>
              <button
                type="button"
                onClick={() => setCategory('poda-escombros')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                  category === 'poda-escombros'
                    ? 'border-[#006b21] bg-[#006b21]/10 text-[#006b21]'
                    : 'border-[#e2e8f0] bg-white text-[#181c1e]'
                }`}
              >
                <Trees className="w-4 h-4" />
                Poda y Escombros
              </button>
            </div>
          </div>

          {/* Shift */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider">
              Turno de Recolección
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              {['todos', 'Matutino', 'Nocturno'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedShift(s)}
                  className={`py-2 px-3 rounded-xl border transition-all ${
                    selectedShift === s
                      ? 'border-[#006b21] bg-[#006b21] text-white'
                      : 'border-[#e2e8f0] bg-white text-[#3e4a3c]'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Neighborhood filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider">
              Barrio
            </label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="h-11 px-3 bg-[#f7fafc] border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#181c1e] outline-none"
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
        <div className="p-4 border-t border-[#e2e8f0] bg-[#f7fafc] flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 h-11 bg-white hover:bg-[#ebeef0] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#555f71]"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-11 bg-[#006b21] hover:bg-[#00872c] text-white rounded-xl text-xs font-bold shadow-md"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
