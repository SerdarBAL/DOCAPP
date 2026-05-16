import manifest from './patientCases.json';

const base = import.meta.env.BASE_URL;

// Three modalities, kept opaque to the reader (blinded). Order is randomized
// per case below so the doctor can't infer from position.
const MODALITIES = ['ldct', 'pred', 'fdct'];

function sliceUrl(modality, patientId, idx) {
  const padded = String(idx).padStart(4, '0');
  return `${base}slices/${modality}/${patientId}_${padded}.png`;
}

// Deterministic shuffle (mulberry32) so the case order is identical across
// browser reloads and across the two radiologists — required for paired study
// analysis. Change SEED if you ever want a fresh randomization.
const SEED = 20260516;
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCases() {
  const cases = [];
  for (const patient of manifest.patients) {
    for (const modality of MODALITIES) {
      const slices = Array.from({ length: patient.sliceCount }, (_, i) =>
        sliceUrl(modality, patient.id, i)
      );
      cases.push({
        id: `${patient.id}-${modality}`,
        patientId: patient.id,
        region: patient.region,
        modality, // hidden from doctor in the UI
        sliceCount: patient.sliceCount,
        sliceUrls: slices,
        meta: patient.meta,
        groundTruth: patient.groundTruth,
      });
    }
  }
  const rand = rng(SEED);
  for (let i = cases.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cases[i], cases[j]] = [cases[j], cases[i]];
  }
  return cases;
}

export const CASES = buildCases();
export const VOCAB = manifest.vocab;

// Kept for backwards compatibility with the old name.
export const MOCK_CASES = CASES;
