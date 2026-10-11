import { BANDS } from './constants.js';

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
}

export function createAudioEngine(audio, { settings = {}, onStatus = () => {} } = {}) {
  let context = null;
  let analyser = null;
  let filters = [];
  let panner = null;

  function ensureAudioGraph() {
    if (context) return;

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    context = new AudioCtor();
    const mediaSource = context.createMediaElementSource(audio);

    filters = BANDS.map((frequency, index) => {
      const filter = context.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : index === BANDS.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1.1;
      filter.gain.value = Number(settings.eq?.[index] ?? 0);
      return filter;
    });

    analyser = context.createAnalyser();
    analyser.fftSize = 256;

    let node = mediaSource;
    for (const filter of filters) {
      node.connect(filter);
      node = filter;
    }

    node.connect(analyser);
    panner = context.createStereoPanner();
    panner.pan.value = (Number(settings.pan ?? 0) || 0) / 100;
    analyser.connect(panner);
    panner.connect(context.destination);
  }

  async function play() {
    if (!audio.src) return false;
    ensureAudioGraph();

    if (context && context.state === 'suspended') {
      await context.resume();
    }

    try {
      await audio.play();
      return true;
    } catch (error) {
      onStatus(`No se pudo reproducir: ${error.message || 'error desconocido'}`);
      return false;
    }
  }

  function pause() {
    audio.pause();
  }

  function setVolume(value) {
    const normalized = clamp(Number(value) || 0, 0, 100);
    settings.volume = normalized;
    audio.volume = normalized / 100;
    return normalized;
  }

  function setPan(value) {
    const normalized = clamp(Math.round(Number(value) || 0), -100, 100);
    settings.pan = normalized;
    if (panner) panner.pan.value = normalized / 100;
    return normalized;
  }

  function applyEq(eqValues = []) {
    const normalized = eqValues.map((value, index) => Number(value ?? settings.eq?.[index] ?? 0));
    settings.eq = normalized;

    if (!filters.length) return normalized;
    filters.forEach((filter, index) => {
      filter.gain.value = Number(normalized[index] ?? 0);
    });

    return normalized;
  }

  function setMode(mode = 'bars') {
    settings.vizMode = mode;
    return mode;
  }

  return {
    ensureAudioGraph,
    play,
    pause,
    setVolume,
    setPan,
    applyEq,
    setMode,
    get analyser() {
      return analyser;
    },
    get context() {
      return context;
    },
    getTimeLabel: (seconds, countdown = false) => {
      if (countdown && Number.isFinite(audio.duration) && audio.duration > 0) {
        return `-${formatTime(Math.max(0, audio.duration - seconds))}`;
      }
      return formatTime(seconds);
    }
  };
}
