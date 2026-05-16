import React, { useState, useMemo } from 'react';
import TopBar from './components/TopBar';
import CTViewer from './components/CTViewer';
import ClinicalForm from './components/ClinicalForm';
import CompletionScreen from './components/CompletionScreen';
import { CASES } from './data/mockCases';
import { submitCase, WEBHOOK_URL } from './submission';

function App() {
  const [readerId, setReaderId] = useState('');
  const [readerStarted, setReaderStarted] = useState(false);

  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitStatus, setLastSubmitStatus] = useState(null); // 'ok' | 'failed' | 'skipped' | null

  // Per-case local state. `marking` + `formState` are the *current draft*
  // lesion the doctor is sketching. Completed lesions are appended to
  // `lesions[]` via "Lezyon Ekle" — a case can carry multiple.
  const [marking, setMarking] = useState(null); // { sliceIdx, points: [{x,y}] }
  const [formState, setFormState] = useState({});
  const [lesions, setLesions] = useState([]);   // [{ sliceIdx, points, clinicalData }]

  const currentCase = CASES[currentCaseIndex];
  const isStudyComplete = currentCaseIndex >= CASES.length;

  const regionCounts = useMemo(() => {
    const out = {};
    CASES.forEach((c) => { out[c.region] = (out[c.region] || 0) + 1; });
    return out;
  }, []);

  const isFormComplete = () => !!(formState.location && formState.diagnosis);
  const isDraftValid = !!(marking && marking.points.length > 5 && isFormComplete());

  const handleAddLesion = () => {
    if (!isDraftValid) return;
    setLesions((prev) => [...prev, {
      sliceIdx: marking.sliceIdx,
      points: marking.points,
      clinicalData: formState,
    }]);
    setMarking(null);
    setFormState({});
  };

  const handleRemoveLesion = (idx) => {
    setLesions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = async () => {
    // Auto-include the current draft if it is fully filled out.
    const finalLesions = isDraftValid
      ? [...lesions, {
          sliceIdx: marking.sliceIdx,
          points: marking.points,
          clinicalData: formState,
        }]
      : lesions;

    const payload = {
      readerId,
      caseId: currentCase.id,
      patientId: currentCase.patientId,
      region: currentCase.region,
      modality: currentCase.modality, // kept in the export, hidden from UI
      sliceCount: currentCase.sliceCount,
      lesions: finalLesions,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    const result = await submitCase(payload);
    setSubmitting(false);

    if (result.ok) {
      setLastSubmitStatus('ok');
    } else if (result.skipped) {
      setLastSubmitStatus('skipped');
    } else {
      setLastSubmitStatus('failed');
      // Keep a copy in localStorage so nothing is lost if the network drops.
      try {
        const key = `docapp-pending-${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (_) { /* quota: ignore */ }
    }

    setResults((prev) => [...prev, { ...payload, transport: result }]);
    setMarking(null);
    setFormState({});
    setLesions([]);
    setCurrentCaseIndex((prev) => prev + 1);
  };

  const handleReset = () => setMarking(null);

  const canProceed = lesions.length > 0 || isDraftValid;

  if (!readerStarted) {
    return <ReaderGate readerId={readerId} setReaderId={setReaderId} onStart={() => setReaderStarted(true)} caseCount={CASES.length} regionCounts={regionCounts} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans">
      {isStudyComplete ? (
        <CompletionScreen payloadData={results} regionCounts={regionCounts} readerId={readerId} />
      ) : (
        <>
          <TopBar
            currentCase={currentCaseIndex + 1}
            totalCases={CASES.length}
            region={currentCase.region}
            patientId={currentCase.patientId}
            readerId={readerId}
            onReset={handleReset}
            onAddLesion={handleAddLesion}
            canAddLesion={isDraftValid}
            lesionsCount={lesions.length}
            onNext={handleNext}
            canProceed={canProceed && !submitting}
            submitting={submitting}
            lastSubmitStatus={lastSubmitStatus}
            webhookConfigured={!!WEBHOOK_URL}
          />
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative">
            <CTViewer
              caseData={currentCase}
              marking={marking}
              setMarking={setMarking}
              savedLesions={lesions}
            />
            <ClinicalForm
              region={currentCase.region}
              formState={formState}
              setFormState={setFormState}
              isMarked={marking && marking.points.length > 5}
              lesions={lesions}
              onRemoveLesion={handleRemoveLesion}
            />
          </main>
        </>
      )}
    </div>
  );
}

function ReaderGate({ readerId, setReaderId, onStart, caseCount, regionCounts }) {
  const summary = Object.entries(regionCounts)
    .map(([r, n]) => `${n} ${r.toLowerCase()}`)
    .join(', ');
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
      <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Dual-UNet LDCT Radyolog Çalışması</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Toplam <strong>{caseCount}</strong> kaydırılabilir BT serisi
          değerlendireceksiniz ({summary}). Her olguda gördüğünüz <strong>her
          lezyon</strong> için sınırı çizin, formu doldurun ve "Lezyon
          Ekle"ye basın — aynı olguda birden çok lezyon kaydedebilirsiniz.
          Her serinin ediniminde kullanılan kaynak (düşük doz, model tahmini,
          tam doz) körlenmiştir.
        </p>
        <label className="text-sm font-semibold text-slate-300">Radyolog kimliği veya baş harfleri</label>
        <input
          autoFocus
          value={readerId}
          onChange={(e) => setReaderId(e.target.value)}
          placeholder="örn. R1 veya SB"
          className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan-500"
        />
        <button
          disabled={!readerId.trim()}
          onClick={onStart}
          className="mt-6 w-full px-5 py-3 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Çalışmayı Başlat
        </button>
        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
          Kısayollar: kesitler arası geçiş için fare tekerleği veya ↑/↓ tuşları,
          ilk/son kesit için Home/End, lezyon işaretlemek için tıkla-sürükle.
        </p>
      </div>
    </div>
  );
}

export default App;
