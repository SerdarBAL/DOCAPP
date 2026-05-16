import React from 'react';
import { DownloadCloud, CheckCircle, Database } from 'lucide-react';

export default function CompletionScreen({ payloadData, regionCounts, readerId }) {
  const handleDownload = () => {
    const dataStr = JSON.stringify(
      { readerId, completedAt: new Date().toISOString(), results: payloadData },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = (readerId || 'radyolog').replace(/[^A-Za-z0-9_-]/g, '_');
    a.href = url;
    a.download = `radyolog-calismasi-${safe}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-radial-gradient from-emerald-900/10 to-slate-950 px-6">
      <div className="max-w-xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-700 ease-out">
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
          <div className="w-24 h-24 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm relative shadow-[0_0_30px_rgba(52,211,153,0.15)] ring-4 ring-emerald-500/10">
            <CheckCircle className="text-emerald-400 w-12 h-12" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-400 mb-3 tracking-tight">
          Çalışma Tamamlandı
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
          {payloadData.length} olgu değerlendirildi{readerId ? ` (${readerId})` : ''}.
          İndirilen JSON dosyasını araştırma ekibine iletmeniz yeterlidir;
          cevaplar ayrıca otomatik olarak da kaydedildi.
        </p>

        <div className="flex gap-4 md:gap-8 justify-center mb-12 w-full">
          {Object.entries(regionCounts || {}).map(([label, count]) => (
            <div key={label} className="bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm rounded-xl py-5 px-6 flex flex-col items-center shadow-lg w-32 border-b-2 border-b-cyan-500/30">
              <span className="text-3xl font-black text-cyan-400 mb-1">{count}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg font-semibold text-lg hover:translate-y-px transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
        >
          <DownloadCloud size={24} />
          <span>Verileri İndir</span>
          <span className="text-sm font-normal text-emerald-100 ml-1">(.json)</span>
        </button>

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Database size={14} />
          <p>Veriler yerel olarak serileştirildi. Bu oturumda dış API'ye veri gönderilmedi.</p>
        </div>
      </div>
    </div>
  );
}
