import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Camera,
  MapPin,
  Upload,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  FileText,
  DownloadCloud,
  Layers,
  ChevronRight,
  X,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { IncidentReport, UserProfile } from '../types';
import { NEIGHBORHOODS_CORRIENTES } from '../data/corrientesData';
import { REPORT_CATEGORIES, formatReportDate } from '../data/reports';
import confetti from 'canvas-confetti';

interface ReportScreenProps {
  reports: IncidentReport[];
  /** Devuelve el reclamo creado, con el código asignado por App. */
  onSubmitReport: (report: Omit<IncidentReport, 'id' | 'code' | 'createdAt' | 'status' | 'statusLabel'>) => IncidentReport;
  onExportReport: (report: IncidentReport) => void;
  profile: UserProfile;
  /** Vista con la que abre la pantalla. */
  initialView?: 'nuevo' | 'historial';
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  reports,
  onSubmitReport,
  onExportReport,
  profile,
  initialView = 'nuevo',
}) => {
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>(initialView);

  // Form State
  const [category, setCategory] = useState<IncidentReport['category']>('microbasural');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(profile.address || 'Calle Junín 1200, Corrientes');
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood || 'Barrio Centro');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmittedCode, setJustSubmittedCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate Camera snapshot
  const triggerCameraSimulation = () => {
    setIsCapturingCamera(true);
    setTimeout(() => {
      // High quality stock image of urban street maintenance
      const samplePhotos = [
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1611288875785-5a1cfdf62b9f?w=600&auto=format&fit=crop&q=80',
      ];
      const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
      setPhotoPreview(randomPhoto);
      setIsCapturingCamera(false);
    }, 1200);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address.trim()) return;

    setIsSubmitting(true);
    const selectedCatObj = REPORT_CATEGORIES.find((c) => c.id === category);

    setTimeout(() => {
      const created = onSubmitReport({
        category,
        categoryLabel: selectedCatObj ? selectedCatObj.label : 'Reclamo',
        title,
        description: description || 'Reclamo registrado por un vecino desde Muni Limpia.',
        address,
        neighborhood,
        photoUrl: photoPreview || undefined,
      });

      setJustSubmittedCode(created.code);
      setIsSubmitting(false);

      // Trigger celebrate confetti (canvas: lee los tokens resueltos)
      try {
        const css = getComputedStyle(document.documentElement);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['--color-brand-500', '--color-brand-accent', '--color-info', '--color-warning'].map((v) =>
            css.getPropertyValue(v).trim()
          ),
        });
      } catch (err) {
        // Safe fallback
      }

      // Reset form
      setTitle('');
      setDescription('');
      setPhotoPreview(null);
      setActiveTab('historial');
    }, 900);
  };

  return (
    <div id="report-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      {/* Header title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
          Reportes Ciudadanos
        </h1>
        <p className="text-xs text-ink-muted">
          Canal directo de denuncias vecinales e higiene urbana de Corrientes
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="bg-surface-muted p-1 rounded-xl flex items-center">
        <button
          id="tab-nuevo-reporte"
          onClick={() => setActiveTab('nuevo')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'nuevo'
              ? 'bg-surface-card text-brand-600 shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          ➕ Nuevo Reporte
        </button>
        <button
          id="tab-mis-reportes"
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
            activeTab === 'historial'
              ? 'bg-surface-card text-brand-600 shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          📋 Mis Reportes ({reports.length})
        </button>
      </div>

      {activeTab === 'nuevo' ? (
        /* Form: Nuevo Reporte */
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. Categoría */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              1. Selecciona el tipo de problema
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REPORT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-soft ring-2 ring-brand-500'
                        : 'border-line bg-surface-card hover:bg-surface'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      <cat.Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink">{cat.label}</h4>
                      <p className="text-xs text-ink-muted line-clamp-2 mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Ubicación */}
          <div className="bg-surface-card p-4 rounded-2xl border border-line flex flex-col gap-3 shadow-sm">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" />
              2. Ubicación del reclamo
            </label>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle y número exacto o intersección..."
                  className="flex-1 h-11 px-3.5 bg-surface border border-line rounded-xl text-sm font-medium text-ink outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setAddress('Calle Junín 1200, Corrientes')}
                  title="Usar GPS actual"
                  className="h-11 px-3 bg-surface-muted hover:bg-brand-500/15 rounded-xl text-xs font-bold text-brand-600 flex items-center gap-1 shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>GPS</span>
                </button>
              </div>

              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-11 px-3.5 bg-surface border border-line rounded-xl text-sm font-medium text-ink outline-none focus:border-brand-500"
              >
                {NEIGHBORHOODS_CORRIENTES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Título y Descripción */}
          <div className="bg-surface-card p-4 rounded-2xl border border-line flex flex-col gap-3 shadow-sm">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-600" />
              3. Detalle del incidente
            </label>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título breve (ej: Microbasural en vereda norte)"
              className="h-11 px-3.5 bg-surface border border-line rounded-xl text-sm font-medium text-ink outline-none focus:border-brand-500"
            />

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo sucedido, referencias o indicaciones adicionales..."
              className="p-3 bg-surface border border-line rounded-xl text-sm font-medium text-ink outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* 4. Foto Evidencia */}
          <div className="bg-surface-card p-4 rounded-2xl border border-line flex flex-col gap-3 shadow-sm">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-600" />
              4. Adjuntar Fotografía (Opcional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-line aspect-video max-h-48 bg-black">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={triggerCameraSimulation}
                  disabled={isCapturingCamera}
                  className="h-20 bg-surface hover:bg-surface-muted border border-dashed border-line-strong rounded-xl flex flex-col items-center justify-center gap-1 text-brand-600 transition-colors"
                >
                  {isCapturingCamera ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                  <span className="text-xs font-bold">
                    {isCapturingCamera ? 'Capturando...' : 'Tomar Foto'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 bg-surface hover:bg-surface-muted border border-dashed border-line-strong rounded-xl flex flex-col items-center justify-center gap-1 text-ink-muted transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-bold">Subir de Galería</span>
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Registrando Reclamo...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Enviar Reporte a Higiene Urbana
              </>
            )}
          </button>
        </form>
      ) : (
        /* Mis Reportes Historial */
        <div className="flex flex-col gap-3.5">
          {reports.length === 0 ? (
            <div className="bg-surface-card rounded-2xl p-8 border border-line text-center flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-10 h-10 text-ink-muted/40" />
              <span className="font-bold text-sm text-ink">
                Aún no has registrado ningún reclamo
              </span>
              <button
                onClick={() => setActiveTab('nuevo')}
                className="mt-2 text-xs text-brand-600 font-bold underline"
              >
                Crear tu primer reporte ahora
              </button>
            </div>
          ) : (
            reports.map((rep) => {
              const statusColors = {
                enviado: 'bg-blue-100 text-blue-800 border-blue-200',
                en_revision: 'bg-purple-100 text-purple-800 border-purple-200',
                cuadrilla_asignada: 'bg-amber-100 text-amber-800 border-amber-200',
                resuelto: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              };

              const progressMap = {
                enviado: 25,
                en_revision: 50,
                cuadrilla_asignada: 75,
                resuelto: 100,
              };

              return (
                <div
                  key={rep.id}
                  id={`report-item-${rep.code}`}
                  className="bg-surface-card rounded-2xl border border-line p-4.5 shadow-sm flex flex-col gap-3.5"
                >
                  {/* Top Bar with Ticket Code & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-brand-600 bg-brand-soft px-2 py-0.5 rounded">
                          #{rep.code}
                        </span>
                        <span className="text-xs text-ink-muted font-medium">
                          {formatReportDate(rep.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-ink mt-1">
                        {rep.title}
                      </h3>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        {rep.address} ({rep.neighborhood})
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        statusColors[rep.status]
                      }`}
                    >
                      {rep.statusLabel}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-ink-muted uppercase tracking-wider">
                      <span>Progreso de Solución</span>
                      <span>{progressMap[rep.status]}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progressMap[rep.status]}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          rep.status === 'resuelto'
                            ? 'bg-success'
                            : rep.status === 'cuadrilla_asignada'
                            ? 'bg-amber-500'
                            : 'bg-brand-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Description & Photo if present */}
                  <div className="bg-surface p-3 rounded-xl border border-line flex items-start gap-3 text-xs">
                    {rep.photoUrl && (
                      <img
                        src={rep.photoUrl}
                        alt="Evidencia"
                        className="w-14 h-14 rounded-lg object-cover border border-line shrink-0"
                      />
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-ink font-medium leading-relaxed">
                        {rep.description}
                      </span>
                      {rep.estimatedResolution && (
                        <span className="text-xs text-brand-600 font-semibold mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rep.estimatedResolution}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Descargar comprobante (D2) */}
                  <div className="flex items-center justify-end pt-1 border-t border-line/60">
                    <button
                      onClick={() => onExportReport(rep)}
                      className="px-3 py-1.5 bg-surface-muted hover:bg-brand-500/15 text-brand-600 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      Descargar comprobante
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
