import React from 'react';
import { ClipboardList, AlertCircle, Trash2, Target } from 'lucide-react';
import { VOCAB } from '../data/mockCases';

export default function ClinicalForm({ region, formState, setFormState, isMarked, lesions = [], onRemoveLesion }) {
  const handle = (field, value) => setFormState((prev) => ({ ...prev, [field]: value }));

  const isFormComplete = () => !!(formState.location && formState.diagnosis);
  const draftNumber = lesions.length + 1;

  return (
    <section className="w-full md:w-[32%] lg:w-[28%] h-full flex flex-col bg-slate-900 border-l border-slate-800">
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="w-8 h-8 rounded-md bg-cyan-950 flex items-center justify-center border border-cyan-800">
          <ClipboardList size={18} className="text-cyan-400" />
        </div>
        <h2 className="text-base font-bold text-slate-100 tracking-tight">Klinik Değerlendirme</h2>
        <span className="ml-auto text-[10px] font-bold tracking-widest text-cyan-300 uppercase bg-cyan-950/30 border border-cyan-800/40 px-2 py-0.5 rounded-full">
          Lezyon {draftNumber}
        </span>
      </div>

      {lesions.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5 mb-1">
            <Target size={12} /> Bu olguda kaydedilen lezyonlar
          </p>
          {lesions.map((les, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-emerald-950/20 border border-emerald-900/40 rounded px-2 py-1.5">
              <span className="font-mono font-bold text-emerald-300">#{i + 1}</span>
              <span className="text-slate-300 truncate flex-1">
                Kesit {les.sliceIdx + 1} · {les.clinicalData?.diagnosis || '—'}
              </span>
              <button
                onClick={() => onRemoveLesion && onRemoveLesion(i)}
                className="p-1 rounded text-slate-400 hover:text-rose-300 hover:bg-rose-950/30"
                title="Lezyonu sil"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {region === 'Toraks' && (
          <>
            <Field label="Anatomik Lokalizasyon" required>
              <Select
                value={formState.location || ''}
                options={VOCAB.chest.anatomicLocation}
                onChange={(v) => handle('location', v)}
              />
            </Field>
            <Field label="Tanı" required>
              <RadioGroup
                name="chest_diagnosis"
                options={VOCAB.chest.diagnosis.map((d) => ({ value: d, label: d }))}
                value={formState.diagnosis || ''}
                onChange={(v) => handle('diagnosis', v)}
              />
            </Field>
            <Field label="Güven düzeyi" hint="Bu seride yaptığınız okumadan ne kadar eminsiniz?">
              <RadioGroup
                name="chest_confidence"
                options={CONFIDENCE_OPTS}
                value={formState.confidence || ''}
                onChange={(v) => handle('confidence', v)}
              />
            </Field>
            <Field label="Görüntü kalitesi" hint="Subjektif — gürültü/keskinlik düzeyi güvenli bir okumaya izin veriyor mu?">
              <RadioGroup
                name="chest_quality"
                options={QUALITY_OPTS}
                value={formState.quality || ''}
                onChange={(v) => handle('quality', v)}
              />
            </Field>
            <Field label="Notlar (opsiyonel)">
              <textarea
                value={formState.notes || ''}
                onChange={(e) => handle('notes', e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Serbest metin gözlemler…"
              />
            </Field>
          </>
        )}

        {region === 'Abdomen' && (
          <>
            <Field label="Anatomik Lokalizasyon" required hint="Couinaud karaciğer segmenti">
              <Select
                value={formState.location || ''}
                options={VOCAB.abdomen.anatomicLocation}
                onChange={(v) => handle('location', v)}
              />
            </Field>
            <Field label="Tanı Kategorisi" required>
              <RadioGroup
                name="abd_diagnosis"
                options={VOCAB.abdomen.diagnosis}
                value={formState.diagnosis || ''}
                onChange={(v) => handle('diagnosis', v)}
              />
            </Field>
            <Field label="Ayrıntılı Tanı" hint="örn. Metastaz-Kolon, Hemanjiom">
              <input
                type="text"
                value={formState.completeDiagnosis || ''}
                onChange={(e) => handle('completeDiagnosis', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Serbest metin açıklama"
              />
            </Field>
            <Field label="Güven düzeyi">
              <RadioGroup
                name="abd_confidence"
                options={CONFIDENCE_OPTS}
                value={formState.confidence || ''}
                onChange={(v) => handle('confidence', v)}
              />
            </Field>
            <Field label="Görüntü kalitesi">
              <RadioGroup
                name="abd_quality"
                options={QUALITY_OPTS}
                value={formState.quality || ''}
                onChange={(v) => handle('quality', v)}
              />
            </Field>
            <Field label="Notlar (opsiyonel)">
              <textarea
                value={formState.notes || ''}
                onChange={(e) => handle('notes', e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Serbest metin gözlemler…"
              />
            </Field>
          </>
        )}
      </div>

      {(!isFormComplete() || !isMarked) && lesions.length === 0 && (
        <div className="p-4 bg-rose-500/10 border-t border-rose-500/20 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-rose-300/90 leading-relaxed">
            Devam etmek için BT görüntüsünde lezyonun sınırını çizin <strong>ve</strong> zorunlu alanları doldurun.
            Birden çok lezyon için <strong>Lezyon Ekle</strong>'ye basın.
          </p>
        </div>
      )}
    </section>
  );
}

const CONFIDENCE_OPTS = [
  { value: 'low', label: 'Düşük' },
  { value: 'moderate', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
];
const QUALITY_OPTS = [
  { value: 'poor', label: 'Zayıf' },
  { value: 'acceptable', label: 'Kabul edilebilir' },
  { value: 'good', label: 'İyi' },
  { value: 'excellent', label: 'Mükemmel' },
];

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 italic">{hint}</p>}
    </div>
  );
}

function Select({ value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer"
      >
        <option value="" disabled>Seçiniz…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    </div>
  );
}

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${value === opt.value ? 'bg-cyan-950/20 border-cyan-600' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
        >
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-1 w-4 h-4 cursor-pointer accent-cyan-400"
          />
          <span className={`text-sm leading-snug ${value === opt.value ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}
