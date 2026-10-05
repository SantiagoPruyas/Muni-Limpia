import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Download,
  ImageUp,
  Loader2,
  LocateFixed,
  MapPin,
  Send,
  X,
} from 'lucide-react';
import { IncidentReport, UserProfile } from '../types';
import { NEIGHBORHOODS_CORRIENTES } from '../data/corrientesData';
import { REPORT_CATEGORIES, REPORT_STATUS_STEPS, formatReportDate } from '../data/reports';
import { reportStatusBadge } from '../lib/reportStatusMeta';

type View = 'nuevo' | 'historial';

interface ReportScreenProps {
  reports: IncidentReport[];
  /** Devuelve el reclamo creado, con el código asignado por App. */
  onSubmitReport: (report: Omit<IncidentReport, 'id' | 'code' | 'createdAt' | 'status' | 'statusLabel'>) => IncidentReport;
  onExportReport: (report: IncidentReport) => void;
  profile: UserProfile;
  /** Vista con la que abre la pantalla. */
  initialView?: View;
}

// "Tomar foto" usa fotos locales (sin red). Fuente: Wikimedia Commons.
// microbasural-vereda: "Garbage bags broken by crows in Tokyo.jpg" (CC0)
// contenedor-desbordado: "Overful trash cans (prague).jpg" (dominio público)
// bolsas-acumuladas: "Brooklyn NY assorted photos 12 garbage bags near No Dumping sign.jpg" (CC0)
const DEMO_PHOTOS = ['/demo/microbasural-vereda.jpg', '/demo/contenedor-desbordado.jpg', '/demo/bolsas-acumuladas.jpg'];

// Lo que "detecta" el GPS simulado.
const DETECTED_LOCATION = { address: 'Calle Junín 1250, Corrientes', neighborhood: 'Barrio Centro' };

const sectionClass = 'bg-surface-card rounded-card border border-line shadow-elev-1 p-4 flex flex-col gap-3';
const sectionTitleClass = 'font-display text-[17px] leading-6 font-bold text-ink';
const labelClass = 'text-sm font-medium text-ink-body';
const fieldClass = (invalid: boolean) =>
  `w-full px-3.5 bg-surface border rounded-control text-base text-ink placeholder:text-ink-muted outline-none focus:border-brand-600 ${
    invalid ? 'border-danger' : 'border-line-strong'
  }`;

export const ReportScreen: React.FC<ReportScreenProps> = ({
  reports,
  onSubmitReport,
  onExportReport,
  profile,
  initialView = 'nuevo',
}) => {
  const [view, setView] = useState<View>(initialView);
  const [submitted, setSubmitted] = useState<IncidentReport | null>(null);

  // Form
  const [category, setCategory] = useState<IncidentReport['category']>('microbasural');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood || 'Barrio Centro');
  const [isLocating, setIsLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; address?: string }>({});
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const successTitleRef = useRef<HTMLHeadingElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const photoSeq = useRef(0);
  // Al cargar o quitar la foto, el botón usado desaparece: el foco pasa al que lo reemplaza.
  const photoButtonRef = useRef<HTMLButtonElement>(null);
  const focusPhotoButton = useRef(false);

  useEffect(() => {
    if (!focusPhotoButton.current) return;
    focusPhotoButton.current = false;
    photoButtonRef.current?.focus();
  }, [photoPreview]);

  // La pantalla de éxito toma el foco para que el lector la anuncie.
  useEffect(() => {
    if (!submitted) return;
    window.scrollTo({ top: 0 });
    successTitleRef.current?.focus({ preventScroll: true });
  }, [submitted]);

  const showView = (next: View) => {
    setView(next);
    setSubmitted(null);
    setCopied(false);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: REPORT_CATEGORIES.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = (moves[e.key] + REPORT_CATEGORIES.length) % REPORT_CATEGORIES.length;
    setCategory(REPORT_CATEGORIES[next].id);
    categoryRefs.current[next]?.focus();
  };

  // Los botones ocupados usan aria-disabled y no `disabled`, que le saca el foco al botón.
  const detectLocation = () => {
    if (isLocating) return;
    setIsLocating(true);
    setLocationDetected(false);
    setTimeout(() => {
      setAddress(DETECTED_LOCATION.address);
      setNeighborhood(DETECTED_LOCATION.neighborhood);
      setErrors((prev) => ({ ...prev, address: undefined }));
      setIsLocating(false);
      setLocationDetected(true);
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      focusPhotoButton.current = true;
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const takePhoto = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setTimeout(() => {
      focusPhotoButton.current = true;
      setPhotoPreview(DEMO_PHOTOS[photoSeq.current++ % DEMO_PHOTOS.length]);
      setIsCapturing(false);
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const nextErrors = {
      title: title.trim() ? undefined : 'Escribí un título para tu reclamo.',
      address: address.trim() ? undefined : 'Indicá la dirección o una referencia.',
    };
    setErrors(nextErrors);
    if (nextErrors.address || nextErrors.title) {
      (nextErrors.address ? addressRef : titleRef).current?.focus();
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const created = onSubmitReport({
        category,
        categoryLabel: REPORT_CATEGORIES.find((c) => c.id === category)?.label ?? 'Reclamo',
        title: title.trim(),
        description: description.trim() || 'Reclamo registrado por un vecino desde Muni Limpia.',
        address: address.trim(),
        neighborhood,
        photoUrl: photoPreview || undefined,
      });

      setIsSubmitting(false);
      setSubmitted(created);
      setTitle('');
      setDescription('');
      setPhotoPreview(null);

      // Confeti breve, solo verdes de marca (canvas: lee los tokens resueltos).
      // Se carga aparte para no sumarlo al JS inicial; es decorativo, así que un fallo se ignora.
      const css = getComputedStyle(document.documentElement);
      import('canvas-confetti')
        .then(({ default: confetti }) =>
          confetti({
            particleCount: 60,
            spread: 60,
            ticks: 120,
            origin: { y: 0.35 },
            disableForReducedMotion: true,
            colors: ['--color-brand-500', '--color-brand-600', '--color-brand-accent', '--color-brand-700'].map((v) =>
              css.getPropertyValue(v).trim()
            ),
          })
        )
        .catch(() => {});
    }, 900);
  };

  const copyCode = async () => {
    if (!submitted) return;
    try {
      await navigator.clipboard.writeText(submitted.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin portapapeles: dejar el código seleccionado para copiarlo a mano.
      const range = document.createRange();
      range.selectNodeContents(codeRef.current!);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  };

  return (
    <div id="report-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[26px] leading-8 font-extrabold text-ink">Reclamos</h1>
        <p className="text-sm text-ink-muted">Higiene urbana de la Ciudad de Corrientes</p>
      </div>

      {/* Segmented control */}
      <div role="group" aria-label="Sección de reclamos" className="bg-surface-muted p-1 rounded-control grid grid-cols-2 gap-1">
        <button
          id="tab-nuevo-reporte"
          type="button"
          aria-pressed={view === 'nuevo'}
          onClick={() => showView('nuevo')}
          className={`h-11 rounded-[10px] text-sm font-semibold transition-colors ${
            view === 'nuevo' ? 'bg-surface-card text-brand-600 shadow-elev-1' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Nuevo reclamo
        </button>
        <button
          id="tab-mis-reportes"
          type="button"
          aria-pressed={view === 'historial'}
          onClick={() => showView('historial')}
          className={`h-11 rounded-[10px] text-sm font-semibold transition-colors ${
            view === 'historial' ? 'bg-surface-card text-brand-600 shadow-elev-1' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Mis reclamos ({reports.length})
        </button>
      </div>

      {view === 'nuevo' && submitted && (
        /* Pantalla de éxito */
        <section
          aria-labelledby="report-success-title"
          className="bg-surface-card rounded-card border border-line shadow-elev-1 p-6 flex flex-col items-center text-center gap-4 animate-fadeIn"
        >
          <span className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-brand-500" aria-hidden />
          </span>
          <div>
            <h2
              id="report-success-title"
              ref={successTitleRef}
              tabIndex={-1}
              className="font-display text-xl leading-[26px] font-bold text-ink"
            >
              Reclamo enviado
            </h2>
            <p className="text-[15px] leading-[22px] text-ink-muted mt-1">Te avisaremos cuando cambie el estado.</p>
          </div>

          <div className="w-full rounded-control bg-surface border border-line p-4 flex flex-col items-center gap-1">
            <span id="report-success-code-label" className="text-xs font-medium text-ink-muted">
              Número de reclamo
            </span>
            <span
              ref={codeRef}
              id="report-success-code"
              className="font-mono text-2xl font-bold text-brand-600 tabular-nums select-all"
            >
              {submitted.code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="mt-1 h-10 px-3 inline-flex items-center gap-1.5 rounded-control text-sm font-semibold text-brand-600 hover:bg-brand-soft transition-colors"
            >
              {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? 'Código copiado' : ''}
            </span>
          </div>

          <dl className="w-full text-left text-sm divide-y divide-line">
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-ink-muted">Categoría</dt>
              <dd className="text-ink font-medium text-right">{submitted.categoryLabel}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-ink-muted">Dirección</dt>
              <dd className="text-ink font-medium text-right">
                {submitted.address} · {submitted.neighborhood}
              </dd>
            </div>
          </dl>

          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={() => showView('historial')}
              className="h-12 rounded-control bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardList className="w-5 h-5" aria-hidden />
              Ver mis reclamos
            </button>
            <button
              type="button"
              onClick={() => onExportReport(submitted)}
              className="h-12 rounded-control bg-surface-muted hover:bg-brand-soft text-brand-600 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" aria-hidden />
              Descargar comprobante
            </button>
          </div>
        </section>
      )}

      {view === 'nuevo' && !submitted && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Categoría */}
          <section aria-labelledby="report-category-title" className="flex flex-col gap-3">
            <h2 id="report-category-title" className={sectionTitleClass}>
              Qué tipo de problema es
            </h2>
            <div role="radiogroup" aria-labelledby="report-category-title" className="grid grid-cols-2 gap-2">
              {REPORT_CATEGORIES.map((cat, i) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    ref={(el) => {
                      categoryRefs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-labelledby={`report-cat-${cat.id}`}
                    aria-describedby={`report-cat-${cat.id}-desc`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setCategory(cat.id)}
                    onKeyDown={(e) => handleCategoryKeyDown(e, i)}
                    className={`relative text-left p-3 rounded-control border-2 flex flex-col gap-2 transition-colors ${
                      isSelected ? 'border-brand-600 bg-brand-soft' : 'border-line bg-surface-card hover:border-line-strong'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-control flex items-center justify-center ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-surface-muted text-brand-600'
                      }`}
                    >
                      <cat.Icon className="w-5 h-5" aria-hidden />
                    </span>
                    {isSelected && <Check className="absolute top-3 right-3 w-5 h-5 text-brand-600" aria-hidden />}
                    <span id={`report-cat-${cat.id}`} className="text-sm leading-5 font-semibold text-ink">
                      {cat.label}
                    </span>
                    <span id={`report-cat-${cat.id}-desc`} className="text-xs leading-4 text-ink-muted">
                      {cat.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Ubicación */}
          <section aria-labelledby="report-location-title" className={sectionClass}>
            <h2 id="report-location-title" className={sectionTitleClass}>
              Dónde es
            </h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-address" className={labelClass}>
                Dirección
              </label>
              <input
                id="report-address"
                ref={addressRef}
                type="text"
                autoComplete="street-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setLocationDetected(false);
                  if (e.target.value.trim()) setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'report-address-error' : undefined}
                placeholder="Calle y número, o una esquina"
                className={`h-12 ${fieldClass(!!errors.address)}`}
              />
              {errors.address && (
                <p id="report-address-error" className="text-sm text-danger flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
                  {errors.address}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <button
                type="button"
                onClick={detectLocation}
                aria-disabled={isLocating}
                className="h-11 px-4 inline-flex items-center gap-2 rounded-control bg-surface-muted hover:bg-brand-soft text-brand-600 text-sm font-semibold transition-colors aria-disabled:opacity-70"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <LocateFixed className="w-4 h-4" aria-hidden />
                )}
                {isLocating ? 'Buscando ubicación…' : 'Usar mi ubicación'}
              </button>
              <span aria-live="polite" className="text-sm font-medium text-success">
                {locationDetected && (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" aria-hidden />
                    Ubicación detectada
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-neighborhood" className={labelClass}>
                Barrio
              </label>
              <select
                id="report-neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className={`h-12 ${fieldClass(false)}`}
              >
                {NEIGHBORHOODS_CORRIENTES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Detalle */}
          <section aria-labelledby="report-detail-title" className={sectionClass}>
            <h2 id="report-detail-title" className={sectionTitleClass}>
              Contanos qué pasó
            </h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-title" className={labelClass}>
                Título
              </label>
              <input
                id="report-title"
                ref={titleRef}
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'report-title-error' : undefined}
                placeholder="Ej.: Microbasural en la esquina"
                className={`h-12 ${fieldClass(!!errors.title)}`}
              />
              {errors.title && (
                <p id="report-title-error" className="text-sm text-danger flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
                  {errors.title}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-description" className={labelClass}>
                Descripción <span className="font-normal text-ink-muted">(opcional)</span>
              </label>
              <textarea
                id="report-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Referencias, desde cuándo está, si bloquea la vereda…"
                className={`py-3 resize-none ${fieldClass(false)}`}
              />
            </div>
          </section>

          {/* Foto */}
          <section aria-labelledby="report-photo-title" className={sectionClass}>
            <h2 id="report-photo-title" className={sectionTitleClass}>
              Foto <span className="font-sans text-sm font-normal text-ink-muted">(opcional)</span>
            </h2>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {photoPreview ? (
              <div className="relative rounded-control overflow-hidden border border-line aspect-video bg-ink">
                <img src={photoPreview} alt="Foto adjunta al reclamo" className="w-full h-full object-cover" />
                <button
                  ref={photoButtonRef}
                  type="button"
                  onClick={() => {
                    focusPhotoButton.current = true;
                    setPhotoPreview(null);
                  }}
                  aria-label="Quitar foto"
                  className="absolute top-2 right-2 w-11 h-11 rounded-full bg-ink/75 hover:bg-ink text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  ref={photoButtonRef}
                  type="button"
                  onClick={takePhoto}
                  aria-disabled={isCapturing}
                  className="h-20 rounded-control border border-dashed border-line-strong bg-surface hover:bg-surface-muted text-brand-600 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  {isCapturing ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                  ) : (
                    <Camera className="w-5 h-5" aria-hidden />
                  )}
                  <span className="text-sm font-semibold">{isCapturing ? 'Abriendo cámara…' : 'Tomar foto'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 rounded-control border border-dashed border-line-strong bg-surface hover:bg-surface-muted text-ink-body flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <ImageUp className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-semibold">Subir de galería</span>
                </button>
              </div>
            )}
          </section>

          <button
            type="submit"
            aria-disabled={isSubmitting}
            className="w-full h-12 rounded-control bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-elev-1 transition-colors aria-disabled:opacity-70 aria-disabled:cursor-wait"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                Enviando reclamo…
              </>
            ) : (
              <>
                <Send className="w-5 h-5" aria-hidden />
                Enviar reclamo
              </>
            )}
          </button>
        </form>
      )}

      {view === 'historial' &&
        (reports.length === 0 ? (
          <div className="bg-surface-card rounded-card border border-line p-8 text-center flex flex-col items-center gap-3">
            <ClipboardList className="w-10 h-10 text-ink-muted" aria-hidden />
            <p className="font-display text-[17px] leading-6 font-bold text-ink">Todavía no registraste reclamos</p>
            <p className="text-sm text-ink-muted">Si ves basura acumulada o el camión no pasó, contanos.</p>
            <button
              type="button"
              onClick={() => showView('nuevo')}
              className="h-11 px-4 rounded-control bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
            >
              Hacer un reclamo
            </button>
          </div>
        ) : (
          <ul aria-label="Mis reclamos" className="flex flex-col gap-3">
            {[...reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((rep) => {
              const CategoryIcon = REPORT_CATEGORIES.find((c) => c.id === rep.category)?.Icon ?? ClipboardList;
              const step = REPORT_STATUS_STEPS.findIndex((s) => s.id === rep.status);
              const resolved = rep.status === 'resuelto';
              return (
                <li
                  key={rep.id}
                  id={`report-item-${rep.code}`}
                  className="bg-surface-card rounded-card border border-line shadow-elev-1 p-4 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono text-sm font-bold text-brand-600 select-all">{rep.code}</span>
                        <span className="text-xs text-ink-muted tabular-nums">{formatReportDate(rep.createdAt)}</span>
                      </div>
                      <h3 className="font-display text-[17px] leading-6 font-bold text-ink mt-1">{rep.title}</h3>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${reportStatusBadge[rep.status]}`}
                    >
                      {rep.statusLabel}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <CategoryIcon className="w-4 h-4 text-brand-600 shrink-0" aria-hidden />
                      {rep.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0" aria-hidden />
                      {rep.address} · {rep.neighborhood}
                    </span>
                  </div>

                  {/* Stepper de estado */}
                  <ol aria-label="Estado del reclamo" className="grid grid-cols-4">
                    {REPORT_STATUS_STEPS.map((s, i) => {
                      const complete = i < step || resolved;
                      const current = i === step && !resolved;
                      return (
                        <li
                          key={s.id}
                          aria-current={i === step ? 'step' : undefined}
                          className="relative flex flex-col items-center text-center gap-1.5 px-0.5"
                        >
                          {i > 0 && (
                            <span
                              aria-hidden
                              className={`absolute top-3 -left-1/2 w-full h-0.5 -translate-y-1/2 ${
                                i <= step ? 'bg-brand-600' : 'bg-line-strong'
                              }`}
                            />
                          )}
                          <span
                            className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                              complete
                                ? 'bg-brand-600 text-white'
                                : current
                                  ? 'bg-surface-card border-2 border-brand-600'
                                  : 'bg-surface-card border-2 border-line-strong'
                            }`}
                          >
                            {complete && <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />}
                            {current && <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                          </span>
                          <span className={`text-xs leading-4 ${i <= step ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
                            {s.label}
                            <span className="sr-only">
                              {complete ? ', completado' : current ? ', estado actual' : ', pendiente'}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="flex items-start gap-3 rounded-control bg-surface p-3 text-sm">
                    {rep.photoUrl && (
                      <img
                        src={rep.photoUrl}
                        alt="Foto del reclamo"
                        className="w-16 h-16 rounded-control object-cover border border-line shrink-0"
                      />
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-ink-body leading-relaxed">{rep.description}</p>
                      {rep.estimatedResolution && (
                        <p className="text-xs font-medium text-ink-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          {rep.estimatedResolution}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-line pt-3 -mb-1">
                    <button
                      type="button"
                      onClick={() => onExportReport(rep)}
                      className="h-11 px-3 inline-flex items-center gap-2 rounded-control text-sm font-semibold text-brand-600 hover:bg-brand-soft transition-colors"
                    >
                      <Download className="w-4 h-4" aria-hidden />
                      Descargar comprobante
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
};
