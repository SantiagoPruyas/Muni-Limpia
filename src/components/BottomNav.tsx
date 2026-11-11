import React from 'react';
import { Home, Map, Clock, AlertTriangle } from 'lucide-react';
import { NavTab } from '../types';
import { APP_COLUMN } from '../lib/layout';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Reclamos todavía en gestión (no resueltos). */
  reportCount?: number;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; Icon: typeof Home }> = [
  { id: 'inicio', label: 'Inicio', Icon: Home },
  { id: 'mapa', label: 'Mapa', Icon: Map },
  { id: 'horarios', label: 'Horarios', Icon: Clock },
  { id: 'reportar', label: 'Reportar', Icon: AlertTriangle },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  reportCount = 0,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Secciones"
      className={`fixed bottom-0 inset-x-0 z-40 ${APP_COLUMN} bg-surface-card border-t border-line lg:border-x pb-[env(safe-area-inset-bottom,0px)]`}
    >
      <div className="flex items-stretch h-16 px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-brand-600' : 'text-ink-muted hover:text-brand-600'
              }`}
            >
              {isActive && (
                <span aria-hidden="true" className="absolute top-0 w-10 h-[3px] rounded-b-full bg-brand-500" />
              )}
              <Icon className="w-5 h-5" />
              <span className={`text-xs leading-4 ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
              {id === 'reportar' && reportCount > 0 && (
                <span
                  role="img"
                  aria-label={`${reportCount} ${reportCount === 1 ? 'reclamo' : 'reclamos'} en gestión`}
                  className="absolute top-1.5 left-1/2 ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-white text-xs font-semibold leading-[18px] text-center tabular-nums"
                >
                  {reportCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
