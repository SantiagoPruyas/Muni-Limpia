import React, { useState, useMemo, useRef } from 'react';
import {
  CORRIENTES_ZONES,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
} from './data/corrientesData';
import {
  NavTab,
  ZoneLocation,
  IncidentReport,
  NotificationItem,
  UserProfile,
  FilterCategory,
  ZoneFilters,
} from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MapScreen } from './components/MapScreen';
import { HomeScreen } from './components/HomeScreen';
import { SchedulesScreen } from './components/SchedulesScreen';
import { ReportScreen } from './components/ReportScreen';
import { RouteDetailsModal } from './components/RouteDetailsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import { FilterModal } from './components/FilterModal';
import { ShareModal } from './components/ShareModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { downloadReceipt, downloadSchedule } from './services/downloadService';

const DEFAULT_FILTERS: ZoneFilters = { category: 'todos', neighborhood: 'todos', shift: 'todos' };
const MAX_TOASTS = 2;
const TOAST_MS = 4500;

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');

  // Filtro único de zonas: lo leen las píldoras del mapa, FilterModal y Horarios.
  // Un resultado vacío queda vacío (las pantallas muestran "Limpiar filtros").
  const [filters, setFilters] = useState<ZoneFilters>(DEFAULT_FILTERS);
  const filteredZones = useMemo(
    () =>
      CORRIENTES_ZONES.filter(
        (z) =>
          (filters.category === 'todos' || z.category === filters.category) &&
          (filters.neighborhood === 'todos' || z.neighborhood === filters.neighborhood) &&
          (filters.shift === 'todos' || z.shift === filters.shift)
      ),
    [filters]
  );
  const activeFilterCount = Object.values(filters).filter((v) => v !== 'todos').length;
  const setCategory = (category: FilterCategory) => setFilters((prev) => ({ ...prev, category }));
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const [selectedZone, setSelectedZone] = useState<ZoneLocation>(CORRIENTES_ZONES[0]); // Junin 1200
  const [activeReminders, setActiveReminders] = useState<string[]>(['junin-1200']);

  // Seleccionar una zona que el filtro oculta (voz, notificaciones) limpia el filtro.
  const selectZone = (zone: ZoneLocation) => {
    setSelectedZone(zone);
    if (!filteredZones.some((z) => z.id === zone.id)) clearFilters();
  };

  // Citizen Reports & Notifications State
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const reportSeq = useRef(Math.max(...INITIAL_REPORTS.map((r) => Number(r.code.split('-')[2]))));

  // Perfil demo ficticio (D5)
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Vecina/o Demo',
    email: 'vecino.demo@example.com',
    neighborhood: 'Barrio Centro',
    address: 'Calle Junín 1200, Corrientes',
    notificationsEnabled: true,
    soundEnabled: true,
  });

  // Modals visibility state
  const [modalRouteZone, setModalRouteZone] = useState<ZoneLocation | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [shareZone, setShareZone] = useState<ZoneLocation | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastSeq = useRef(0);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Máximo MAX_TOASTS visibles; los 'loading' esperan a updateToast para cerrarse.
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++toastSeq.current}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, MAX_TOASTS));
    if (toast.type !== 'loading') setTimeout(() => dismissToast(id), TOAST_MS);
    return id;
  };

  const updateToast = (id: string, toast: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...toast, id } : t)));
    setTimeout(() => dismissToast(id), TOAST_MS);
  };

  // Toggle Reminder / Avisarme
  const handleToggleReminder = (zone: ZoneLocation) => {
    const isCurrentlyActive = activeReminders.includes(zone.id);
    if (isCurrentlyActive) {
      setActiveReminders((prev) => prev.filter((id) => id !== zone.id));
      addToast({
        type: 'info',
        title: 'Recordatorio desactivado',
        message: `Ya no vas a recibir avisos de ${zone.name}.`,
      });
    } else {
      setActiveReminders((prev) => [...prev, zone.id]);
      addToast({
        type: 'success',
        title: 'Recordatorio activado',
        message: `Te avisamos 30 minutos antes del horario (${zone.timeWindow}) en ${zone.name}.`,
      });
    }
  };

  // Descargas (D2): el toast "Generando…" se transforma en el resultado.
  const runDownload = (loadingTitle: string, doneTitle: string, download: () => string) => {
    const id = addToast({ type: 'loading', title: loadingTitle });
    setTimeout(() => {
      try {
        updateToast(id, { type: 'success', title: doneTitle, message: download() });
      } catch {
        updateToast(id, { type: 'error', title: 'No se pudo descargar', message: 'Probá de nuevo en unos segundos.' });
      }
    }, 400);
  };

  const handleDownloadSchedule = (zone: ZoneLocation) =>
    runDownload('Generando horario…', 'Horario descargado', () => downloadSchedule(zone));

  const handleDownloadReceipt = (report: IncidentReport) =>
    runDownload('Generando comprobante…', 'Comprobante descargado', () => downloadReceipt(report));

  // El código del reclamo se genera solo acá y se devuelve a quien envía.
  const handleSubmitReport = (
    newReportData: Omit<IncidentReport, 'id' | 'code' | 'createdAt' | 'status' | 'statusLabel'>
  ): IncidentReport => {
    reportSeq.current += 1;
    const code = `ML-${new Date().getFullYear()}-${String(reportSeq.current).padStart(4, '0')}`;
    const newReport: IncidentReport = {
      ...newReportData,
      id: `rep-${reportSeq.current}`,
      code,
      createdAt: new Date().toISOString(),
      status: 'enviado',
      statusLabel: 'Enviado',
      estimatedResolution: 'Evaluación técnica en curso',
    };

    setReports((prev) => [newReport, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${code}`,
        title: `Reclamo #${code} registrado`,
        message: `${newReport.categoryLabel} en ${newReport.address}. Te avisamos cuando cambie el estado.`,
        time: 'Ahora',
        read: false,
        type: 'report_update',
      },
      ...prev,
    ]);

    addToast({
      type: 'success',
      title: 'Reclamo registrado',
      message: `Tu número de reclamo es #${code}.`,
    });

    return newReport;
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast({
      type: 'info',
      title: 'Notificaciones actualizadas',
      message: 'Todas las alertas marcadas como leídas.',
    });
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-[#181c1e] flex flex-col font-['Public_Sans',sans-serif] selection:bg-[#006b21] selection:text-white">
      {/* Top Header */}
      <Header
        notifications={notifications}
        profile={profile}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Dynamic View Content (pt-16 compensates for fixed header) */}
      <main className="flex-1 w-full pt-16 flex flex-col">
        {activeTab === 'mapa' && (
          <MapScreen
            zones={filteredZones}
            selectedZone={selectedZone}
            onSelectZone={selectZone}
            activeCategory={filters.category}
            onSelectCategory={setCategory}
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            onOpenRouteDetails={(zone) => setModalRouteZone(zone)}
            onOpenFilter={() => setShowFilterModal(true)}
            onShare={(zone) => setShareZone(zone)}
            onToggleReminder={handleToggleReminder}
            activeReminders={activeReminders}
          />
        )}

        {activeTab === 'inicio' && (
          <HomeScreen
            currentZone={selectedZone}
            reports={reports}
            profile={profile}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectZone={selectZone}
            onToggleReminder={handleToggleReminder}
            onExportSchedule={handleDownloadSchedule}
            isReminderActive={activeReminders.includes(selectedZone.id)}
            onOpenReportModal={() => setActiveTab('reportar')}
          />
        )}

        {activeTab === 'horarios' && (
          <SchedulesScreen
            zones={filteredZones}
            activeCategory={filters.category}
            onSelectCategory={setCategory}
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            onSelectZone={(zone) => {
              selectZone(zone);
              setActiveTab('mapa');
            }}
            onOpenRouteDetails={(zone) => setModalRouteZone(zone)}
            onToggleReminder={handleToggleReminder}
            onExportSchedule={handleDownloadSchedule}
            onShare={(zone) => setShareZone(zone)}
            activeReminders={activeReminders}
          />
        )}

        {activeTab === 'reportar' && (
          <ReportScreen
            reports={reports}
            onSubmitReport={handleSubmitReport}
            onExportReport={handleDownloadReceipt}
            profile={profile}
          />
        )}
      </main>

      {/* Bottom Floating Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        reportCount={reports.filter((r) => r.status !== 'resuelto').length}
      />

      {/* Modals & Dialog Overlays */}
      <RouteDetailsModal
        zone={modalRouteZone}
        onClose={() => setModalRouteZone(null)}
        onExportSchedule={handleDownloadSchedule}
      />

      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onClearAll={() => setNotifications([])}
          onSelectZoneById={(zoneId) => {
            const found = CORRIENTES_ZONES.find((z) => z.id === zoneId);
            if (found) {
              selectZone(found);
              setActiveTab('mapa');
            }
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onSaveProfile={(newProf) => {
            setProfile(newProf);
            addToast({
              type: 'success',
              title: 'Perfil actualizado',
              message: 'Guardamos tus datos.',
            });
          }}
        />
      )}

      {showFilterModal && (
        <FilterModal
          filters={filters}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={setFilters}
        />
      )}

      {shareZone && (
        <ShareModal
          zone={shareZone}
          onClose={() => setShareZone(null)}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
