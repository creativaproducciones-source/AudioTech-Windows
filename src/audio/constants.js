export const BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const PRESETS = Object.freeze({
  Plano: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [5, 4, 3, 1, -1, -1, 1, 3, 4, 4],
  Pop: [-1, 2, 3, 4, 3, 0, -1, -1, 1, 2],
  Bajos: [7, 6, 5, 3, 1, 0, 0, 0, 0, 0],
  Voces: [-2, -2, 0, 2, 4, 4, 3, 1, 0, -1],
  Club: [4, 3, 1, 0, -1, -1, 0, 2, 3, 3]
});

export const DEFAULT_EQ = Object.freeze(Array.from({ length: BANDS.length }, () => 0));
