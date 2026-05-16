import React from 'react';
import { RefreshCcw, ArrowRight, Dna, UserRound, Cloud, CloudOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TopBar({
  currentCase,
  totalCases,
  region,
  patientId,
  readerId,
  onReset,
  onNext,
  canProceed,
  submitting,
  lastSubmitStatus,
  webhookConfigured,
}) {
  const progressPercent = ((currentCase - 1) / totalCases) * 100;

  return (
    <header className="h-16 flex-shrink-0 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
          <Dna size={22} className="opacity-90" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-100 text-sm">
            Olgu {currentCase} / {totalCases}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/30 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              {region}
            </span>
            <span className="text-[10px] font-mono tracking-wider text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-full">
              Hasta {patientId}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:block flex-1 max-w-sm mx-8">
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitPill webhookConfigured={webhookConfigured} status={lastSubmitStatus} submitting={submitting} />
        {readerId && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
            <UserRound size={14} />
            <span className="font-mono">{readerId}</span>
          </div>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-colors"
          title="Lezyon çizimini sil"
        >
          <RefreshCcw size={16} />
          <span>Çizimi Sıfırla</span>
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
                     bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 focus:ring-2 focus:ring-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Gönderiliyor…</span>
            </>
          ) : (
            <>
              <span>Sonraki Olgu</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </header>
  );
}

function SubmitPill({ webhookConfigured, status, submitting }) {
  if (submitting) {
    return (
      <Pill cls="bg-slate-800/70 border-slate-700 text-cyan-300">
        <Loader2 size={14} className="animate-spin" /> Gönderiliyor
      </Pill>
    );
  }
  if (!webhookConfigured) {
    return (
      <Pill cls="bg-amber-950/40 border-amber-800 text-amber-300" title="VITE_WEBHOOK_URL ayarlanmamış. Cevaplar yalnızca yerel olarak saklanır.">
        <CloudOff size={14} /> Yalnızca yerel
      </Pill>
    );
  }
  if (status === 'ok') {
    return (
      <Pill cls="bg-emerald-950/40 border-emerald-800 text-emerald-300">
        <CheckCircle2 size={14} /> Gönderildi
      </Pill>
    );
  }
  if (status === 'failed') {
    return (
      <Pill cls="bg-rose-950/40 border-rose-800 text-rose-300" title="Gönderim başarısız. Olgu yerel olarak saklandı; Sonraki Olgu'ya tekrar tıklayarak deneyebilir veya sonunda dışa aktarabilirsiniz.">
        <AlertTriangle size={14} /> Gönderim başarısız
      </Pill>
    );
  }
  return (
    <Pill cls="bg-slate-800/60 border-slate-700 text-slate-400">
      <Cloud size={14} /> Hazır
    </Pill>
  );
}

function Pill({ cls, title, children }) {
  return (
    <div title={title} className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${cls}`}>
      {children}
    </div>
  );
}
