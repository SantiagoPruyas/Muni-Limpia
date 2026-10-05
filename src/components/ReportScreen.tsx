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
import confetti from 'canvas-confetti';

interface ReportScreenProps {
  reports: IncidentReport[];
  onSubmitReport: (report: Omit<IncidentReport, 'id' | 'code' | 'createdAt' | 'status' | 'statusLabel'>) => void;
  onExportReport: (report: IncidentReport) => void;
  profile: UserProfile;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  reports,
  onSubmitReport,
  onExportReport,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');

  // Form State
  const [category, setCategory] = useState<IncidentReport['category']>('microbasural');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(profile.address || 'Calle Junín 1200, Corrientes');
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood || 'Barrio Centro');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveToDrive, setSaveToDrive] = useState(true);
  const [justSubmittedCode, setJustSubmittedCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    {
      id: 'microbasural',
      label: 'Microbasural',
      desc: 'Acumulación de basura en esquinas o terrenos',
      icon: '🗑️',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      id: 'contenedor_lleno',
      label: 'Contenedor Colmado / Roto',
      desc: 'Contenedor sin capacidad o con daños',
      icon: '📦',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'poda_escombros',
      label: 'Poda y Escombros',
      desc: 'Ramas voluminosas u obras sin retiro',
      icon: '🌿',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'animal_muerto',
      label: 'Animal en Vía Pública',
      desc: 'Retiro urgente bromatológico',
      icon: '⚠️',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'falta_recoleccion',
      label: 'Falta de Recolección',
      desc: 'El camión no pasó en su horario habitual',
      icon: '🚛',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'otro',
      label: 'Otro Reclamo',
      desc: 'Cuestiones generales de higiene urbana',
      icon: '📋',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

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
    const selectedCatObj = categories.find((c) => c.id === category);

    setTimeout(() => {
      onSubmitReport({
        category,
        categoryLabel: selectedCatObj ? selectedCatObj.label : 'Reclamo',
        title,
        description: description || 'Reporte registrado por vecino a través de Muni Limpia Corrientes.',
        address,
        neighborhood,
        photoUrl: photoPreview || undefined,
        syncedToDrive: saveToDrive,
      });

      const newCode = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
      setJustSubmittedCode(newCode);
      setIsSubmitting(false);

      // Trigger celebrate confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#006b21', '#81fc89', '#2563eb', '#f59e0b'],
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
        <h1 className="text-2xl font-black text-[#181c1e] tracking-tight">
          Reportes Ciudadanos
        </h1>
        <p className="text-xs text-[#555f71]">
          Canal directo de denuncias vecinales e higiene urbana de Corrientes
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="bg-[#ebeef0] p-1 rounded-xl flex items-center">
        <button
          id="tab-nuevo-reporte"
          onClick={() => setActiveTab('nuevo')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'nuevo'
              ? 'bg-white text-[#006b21] shadow-sm'
              : 'text-[#555f71] hover:text-[#181c1e]'
          }`}
        >
          ➕ Nuevo Reporte
        </button>
        <button
          id="tab-mis-reportes"
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
            activeTab === 'historial'
              ? 'bg-white text-[#006b21] shadow-sm'
              : 'text-[#555f71] hover:text-[#181c1e]'
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
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider">
              1. Selecciona el tipo de problema
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id as IncidentReport['category'])}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#006b21] bg-[#006b21]/5 ring-2 ring-[#006b21]'
                        : 'border-[#e2e8f0] bg-white hover:bg-[#f7fafc]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div>
                      <h4 className="text-xs font-bold text-[#181c1e]">{cat.label}</h4>
                      <p className="text-[10px] text-[#555f71] line-clamp-2 mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Ubicación */}
          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] flex flex-col gap-3 shadow-sm">
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#006b21]" />
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
                  className="flex-1 h-11 px-3.5 bg-[#f7fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#181c1e] outline-none focus:border-[#006b21]"
                />
                <button
                  type="button"
                  onClick={() => setAddress('Calle Junín 1200, Corrientes')}
                  title="Usar GPS actual"
                  className="h-11 px-3 bg-[#f1f4f6] hover:bg-[#e5e9eb] rounded-xl text-xs font-bold text-[#006b21] flex items-center gap-1 shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>GPS</span>
                </button>
              </div>

              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-11 px-3.5 bg-[#f7fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#181c1e] outline-none focus:border-[#006b21]"
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
          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] flex flex-col gap-3 shadow-sm">
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#006b21]" />
              3. Detalle del incidente
            </label>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título breve (ej: Microbasural en vereda norte)"
              className="h-11 px-3.5 bg-[#f7fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#181c1e] outline-none focus:border-[#006b21]"
            />

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo sucedido, referencias o indicaciones adicionales..."
              className="p-3 bg-[#f7fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#181c1e] outline-none focus:border-[#006b21] resize-none"
            />
          </div>

          {/* 4. Foto Evidencia */}
          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] flex flex-col gap-3 shadow-sm">
            <label className="text-xs font-bold text-[#181c1e] uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#006b21]" />
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
              <div className="relative rounded-xl overflow-hidden border border-[#e2e8f0] aspect-video max-h-48 bg-black">
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
                  className="h-20 bg-[#f7fafc] hover:bg-[#f1f4f6] border border-dashed border-[#bdcab8] rounded-xl flex flex-col items-center justify-center gap-1 text-[#006b21] transition-colors"
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
                  className="h-20 bg-[#f7fafc] hover:bg-[#f1f4f6] border border-dashed border-[#bdcab8] rounded-xl flex flex-col items-center justify-center gap-1 text-[#555f71] transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-bold">Subir de Galería</span>
                </button>
              </div>
            )}
          </div>

          {/* Google Drive Checkbox Backup */}
          <div className="bg-[#f1f4f6] p-3.5 rounded-xl border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <DownloadCloud className="w-5 h-5 text-[#006b21]" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#181c1e]">
                  Guardar comprobante en Google Drive
                </span>
                <span className="text-[10px] text-[#555f71]">
                  Se sincronizará automáticamente el ticket en tu nube
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={saveToDrive}
              onChange={(e) => setSaveToDrive(e.target.checked)}
              className="w-5 h-5 accent-[#006b21] rounded cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 bg-[#006b21] hover:bg-[#00872c] text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70"
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
            <div className="bg-white rounded-2xl p-8 border border-[#e2e8f0] text-center flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-10 h-10 text-[#555f71]/40" />
              <span className="font-bold text-sm text-[#181c1e]">
                Aún no has registrado ningún reclamo
              </span>
              <button
                onClick={() => setActiveTab('nuevo')}
                className="mt-2 text-xs text-[#006b21] font-bold underline"
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
                  className="bg-white rounded-2xl border border-[#e2e8f0] p-4.5 shadow-sm flex flex-col gap-3.5"
                >
                  {/* Top Bar with Ticket Code & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-[#006b21] bg-[#006b21]/10 px-2 py-0.5 rounded">
                          #{rep.code}
                        </span>
                        <span className="text-xs text-[#555f71] font-medium">
                          {rep.createdAt}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#181c1e] mt-1 font-['Public_Sans',sans-serif]">
                        {rep.title}
                      </h3>
                      <p className="text-xs text-[#555f71] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#006b21]" />
                        {rep.address} ({rep.neighborhood})
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                        statusColors[rep.status]
                      }`}
                    >
                      {rep.statusLabel}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold text-[#555f71] uppercase tracking-wider">
                      <span>Progreso de Solución</span>
                      <span>{progressMap[rep.status]}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#f1f4f6] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progressMap[rep.status]}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          rep.status === 'resuelto'
                            ? 'bg-[#059669]'
                            : rep.status === 'cuadrilla_asignada'
                            ? 'bg-amber-500'
                            : 'bg-[#006b21]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Description & Photo if present */}
                  <div className="bg-[#f7fafc] p-3 rounded-xl border border-[#e2e8f0] flex items-start gap-3 text-xs">
                    {rep.photoUrl && (
                      <img
                        src={rep.photoUrl}
                        alt="Evidencia"
                        className="w-14 h-14 rounded-lg object-cover border border-[#e2e8f0] shrink-0"
                      />
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-[#181c1e] font-medium leading-relaxed">
                        {rep.description}
                      </span>
                      {rep.estimatedResolution && (
                        <span className="text-[11px] text-[#006b21] font-semibold mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rep.estimatedResolution}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Export to Google Drive */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#e2e8f0]/60">
                    <div className="flex items-center gap-1.5 text-xs text-[#555f71]">
                      <DownloadCloud className="w-3.5 h-3.5 text-[#006b21]" />
                      <span>Backup: {rep.syncedToDrive ? 'Sincronizado' : 'Pendiente'}</span>
                    </div>

                    <button
                      onClick={() => onExportReport(rep)}
                      className="px-3 py-1.5 bg-[#f1f4f6] hover:bg-[#e5e9eb] text-[#006b21] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      Descargar / Google Drive
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
