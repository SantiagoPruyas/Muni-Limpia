import { Layers, Recycle, Trash2, Trees, type LucideIcon } from 'lucide-react';
import { FilterCategory } from '../types';

export interface CategoryMeta {
  label: string;
  Icon: LucideIcon;
  /** Nombre del token de color: se usa como `var(--color-${colorToken})`. */
  colorToken: 'brand-600' | 'cat-comunes' | 'cat-reciclables' | 'cat-poda';
}

export const categoryMeta: Record<FilterCategory, CategoryMeta> = {
  todos: { label: 'Todos', Icon: Layers, colorToken: 'brand-600' },
  'residuos-comunes': { label: 'Residuos comunes', Icon: Trash2, colorToken: 'cat-comunes' },
  reciclables: { label: 'Reciclables', Icon: Recycle, colorToken: 'cat-reciclables' },
  'poda-escombros': { label: 'Poda y escombros', Icon: Trees, colorToken: 'cat-poda' },
  'puntos-verdes': { label: 'Puntos Verdes', Icon: Recycle, colorToken: 'cat-reciclables' },
};
