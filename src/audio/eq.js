import { BANDS, PRESETS } from './constants.js';

export function buildEqRows() {
  return BANDS.map((frequency, index) => ({
    index,
    frequency,
    label: frequency >= 1000 ? `${frequency / 1000}k` : String(frequency),
    value: 0
  }));
}

export function normalizeEqValues(values = []) {
  return BANDS.map((_, index) => {
    const value = Number(values[index]);
    return Number.isFinite(value) ? value : 0;
  });
}

export function getPresetValues(name) {
  if (!name || !PRESETS[name]) {
    return normalizeEqValues(DEFAULT_EQ);
  }

  return PRESETS[name].map((value) => Number(value));
}

export function applyPreset(eqValues, name) {
  const preset = PRESETS[name];
  if (!preset) {
    return normalizeEqValues(eqValues);
  }

  return preset.map((value, index) => Number(eqValues[index] ?? value));
}

export function getEqDescriptor() {
  return {
    bands: BANDS,
    presets: PRESETS
  };
}

const DEFAULT_EQ = Array.from({ length: BANDS.length }, () => 0);
