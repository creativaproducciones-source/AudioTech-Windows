import { BANDS, PRESETS, DEFAULT_EQ } from './constants.js';
import { buildEqRows, normalizeEqValues, getPresetValues, applyPreset, getEqDescriptor } from './eq.js';
import { createVisualizer } from './visualizer.js';

const audioCore = Object.freeze({
  BANDS,
  PRESETS,
  DEFAULT_EQ,
  buildEqRows,
  normalizeEqValues,
  getPresetValues,
  applyPreset,
  getEqDescriptor,
  createVisualizer
});

window.AudioTechAudio = audioCore;

console.info('[AudioTechAudio] core modularized and available on window.AudioTechAudio');

export default audioCore;
