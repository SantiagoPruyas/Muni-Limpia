import React, { useState, useEffect } from 'react';
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
import {
  exportScheduleToGoogleDrive,
  exportReportToGoogleDrive,
} from './services/driveService';

export default function App() {
  // Navigation State - defaults to 'mapa' to display screenshot immediately
  const [activeTab, setActiveTab] = useState<NavTab>('mapa');

  // Zones & Active Selection State
  const [zones, setZones] = useState<ZoneLocation[]>(CORRIENTES_ZONES);
  const [selectedZone, setSelectedZone] = useState<ZoneLocation>(CORRIENTES_ZONES[0]); // Junin 1200
  const [activeReminders, setActiveReminders] = useState<string[]>(['junin-1200']);

  // Citizen Reports & Notifications State
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // User Profile
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Santiago Pruyas',
    email: 'santi.pruyas@gmail.com',
    neighborhood: 'Barrio Centro',
    address: 'Calle Junín 1200, Corrientes',
    notificationsEnabled: true,
    soundEnabled: true,
    driveSyncEnabled: true,
    googleAccountConnected: true,
  });

  // Modals visibility state
  const [modalRouteZone, setModalRouteZone] = useState<ZoneLocation | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [shareZone, setShareZone] = useState<ZoneLocation | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [newToast, ...prev.slice(0, 3)]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle Reminder / Avisarme
  const handleToggleReminder = (zone: ZoneLocation) => {
    const isCurrentlyActive = activeReminders.includes(zone.id);
    if (isCurrentlyActive) {
      setActiveReminders((prev) => prev.filter((id) => id !== zone.id));
      addToast({
        type: 'info',
        title: 'Recordatorio Desactivado',
        message: `Ya no recibirás alertas de paso para "${zone.name}".`,
      });
    } else {
      setActiveReminders((prev) => [...prev, zone.id]);
      addToast({
        type: 'success',
        title: '¡Alarma de Recolección Activada!',
        message: `Te notificaremos 30 minutos antes de la ventana horaria (${zone.timeWindow}) en ${zone.name}.`,
      });
    }
  };

  // Google Drive export for Schedule
  const handleExportSchedule = async (zone: ZoneLocation) => {
    addToast({
      type: 'info',
      title: 'Sincronizando con Google Drive...',
      message: `Guardando cronograma de ${zone.name} en tu nube.`,
    });

    try {
      const result = await exportScheduleToGoogleDrive(zone);
      addToast({
        type: 'drive',
        title: '¡Guardado en Google Drive!',
        message: `Archivo "${result.fileName}" guardado con éxito.`,
        linkUrl: result.fileUrl,
        linkLabel: 'Ver en Google Drive',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error de sincronización',
        message: 'No se pudo completar el backup en Drive.',
      });
    }
  };

  // Google Drive export for Incident Report
  const handleExportReport = async (report: IncidentReport) => {
    addToast({
      type: 'info',
      title: 'Generando comprobante en Drive...',
      message: `Respaldando ticket #${report.code}.`,
    });

    try {
      const result = await exportReportToGoogleDrive(report);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, syncedToDrive: true } : r))
      );
      addToast({
        type: 'drive',
        title: '¡Comprobante en Google Drive!',
        message: result.message,
        linkUrl: result.fileUrl,
        linkLabel: 'Abrir ticket en Drive',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error de sincronización',
        message: 'No se pudo guardar el comprobante.',
      });
    }
  };

  // Create new Incident Report
  const handleSubmitReport = async (
    newReportData: Omit<IncidentReport, 'id' | 'code' | 'createdAt' | 'status' | 'statusLabel'>
  ) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newReport: IncidentReport = {
      ...newReportData,
      id: `rep-${Date.now()}`,
      code: `CR-${randomNum}`,
      createdAt: 'Recién',
      status: 'enviado',
      statusLabel: 'Enviado a Higiene Urbana',
      estimatedResolution: 'Evaluación técnica en curso',
    };

    setReports((prev) => [newReport, ...prev]);

    // Also add to notifications
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Reclamo #${newReport.code} registrado`,
        message: `Hemos recibido tu reporte de ${newReport.categoryLabel} en ${newReport.address}.`,
        time: 'Ahora',
        read: false,
        type: 'report_update',
      },
      ...prev,
    ]);

    addToast({
      type: 'success',
      title: '¡Reclamo Registrado Exitosamente!',
      message: `Número de ticket asignado: #${newReport.code}. Se iniciará la revisión vecinal.`,
    });

    // If drive sync is enabled
    if (newReportData.syncedToDrive) {
      await handleExportReport(newReport);
    }
  };

  // Filter apply from filter modal
  const handleApplyFilters = (category: FilterCategory, neighborhood: string) => {
    let filtered = CORRIENTES_ZONES;
    if (category !== 'todos') {
      filtered = filtered.filter((z) => z.category === category);
    }
    if (neighborhood !== 'todos') {
      filtered = filtered.filter((z) => z.neighborhood === neighborhood);
    }
    setZones(filtered.length > 0 ? filtered : CORRIENTES_ZONES);
    if (filtered.length > 0) {
      setSelectedZone(filtered[0]);
    }
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
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={(zone) => setSelectedZone(zone)}
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
            onSelectZone={(zone) => setSelectedZone(zone)}
            onToggleReminder={handleToggleReminder}
            onExportSchedule={handleExportSchedule}
            isReminderActive={activeReminders.includes(selectedZone.id)}
            onOpenReportModal={() => setActiveTab('reportar')}
          />
        )}

        {activeTab === 'horarios' && (
          <SchedulesScreen
            zones={zones}
            onSelectZone={(zone) => {
              setSelectedZone(zone);
              setActiveTab('mapa');
            }}
            onOpenRouteDetails={(zone) => setModalRouteZone(zone)}
            onToggleReminder={handleToggleReminder}
            onExportSchedule={handleExportSchedule}
            onShare={(zone) => setShareZone(zone)}
            activeReminders={activeReminders}
          />
        )}

        {activeTab === 'reportar' && (
          <ReportScreen
            reports={reports}
            onSubmitReport={handleSubmitReport}
            onExportReport={handleExportReport}
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
        onExportSchedule={handleExportSchedule}
      />

      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onClearAll={() => setNotifications([])}
          onSelectZoneById={(zoneId) => {
            const found = zones.find((z) => z.id === zoneId);
            if (found) {
              setSelectedZone(found);
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
              title: 'Perfil Actualizado',
              message: 'Tus datos y barrio principal fueron guardados.',
            });
          }}
        />
      )}

      {showFilterModal && (
        <FilterModal
          currentCategory={selectedZone.category}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
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
