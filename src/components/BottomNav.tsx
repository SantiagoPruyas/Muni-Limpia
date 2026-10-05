import React from 'react';
import { Home, Map, Clock, AlertTriangle } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  reportCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  reportCount = 0,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'mapa',
      label: 'Mapa',
      icon: <Map className="w-5 h-5" />,
    },
    {
      id: 'horarios',
      label: 'Horarios',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'reportar',
      label: 'Reportar',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: reportCount > 0 ? reportCount : undefined,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-xl border-t border-line shadow-[0_-2px_12px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 relative ${
                isActive
                  ? 'text-brand-600 font-semibold'
                  : 'text-ink-muted hover:text-brand-600'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-full transition-transform ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                >
                  {item.icon}
                </div>
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-brand-600 text-white text-xs font-bold px-1.5 py-0.2 rounded-full border border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[12px] leading-tight mt-0.5 tracking-tight font-medium ${
                  isActive ? 'text-brand-600 font-bold' : 'text-ink-muted'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-8 h-1 bg-brand-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
