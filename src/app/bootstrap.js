import { loadSettings, saveSettings } from '../state/store.js';
import { createAudioEngine } from '../audio/manager.js';

export function initApp() {
  if (window.AudioTechRuntime) return window.AudioTechRuntime;

  const settings = loadSettings();
  const audio = new Audio();
  audio.preload = 'auto';

  const engine = createAudioEngine(audio, {
    settings,
    onStatus: (message) => {
      const node = document.querySelector('#status');
      if (node) node.textContent = message;
    }
  });

  const state = {
    settings,
    audio,
    engine,
    countdown: Boolean(settings.countdown),
    queue: Array.isArray(settings.queue) ? settings.queue : [],
    currentIndex: -1,
    shuffle: Boolean(settings.shuffle),
    repeat: settings.repeat || 'off'
  };

  const ui = {
    play: document.querySelector('#play'),
    prev: document.querySelector('#prev'),
    next: document.querySelector('#next'),
    stop: document.querySelector('#stop'),
    seek: document.querySelector('#seek'),
    vol: document.querySelector('#vol'),
    pan: document.querySelector('#pan'),
    time: document.querySelector('#time'),
    dur: document.querySelector('#dur'),
    status: document.querySelector('#status'),
    viz: document.querySelector('#viz'),
    preset: document.querySelector('#preset')
  };

  function setStatus(message) {
    if (ui.status) ui.status.textContent = message;
  }

  function updateVolumeUI() {
    const value = Number(state.settings.volume || 80);
    if (ui.vol) ui.vol.value = value;
    const pct = document.querySelector('#volpct');
    if (pct) pct.textContent = `${value}%`;
  }

  function updatePanUI() {
    const value = Number(state.settings.pan || 0);
    if (ui.pan) ui.pan.value = value;
    const label = document.querySelector('#panlbl');
    if (label) {
      label.textContent = value === 0 ? 'Centro' : value < 0 ? `L ${Math.abs(value)}%` : `R ${value}%`;
    }
  }

  function bindPlayback() {
    if (ui.play) {
      ui.play.addEventListener('click', async () => {
        if (!audio.src) {
          setStatus('No hay una pista cargada.');
          return;
        }

        const playing = audio.paused;
        if (playing) {
          await engine.play();
          ui.play.textContent = '⏸';
          return;
        }

        engine.pause();
        ui.play.textContent = '▶';
      });
    }

    if (ui.stop) {
      ui.stop.addEventListener('click', () => {
        engine.pause();
        audio.currentTime = 0;
        if (ui.play) ui.play.textContent = '▶';
      });
    }

    if (ui.prev) {
      ui.prev.addEventListener('click', () => {
        setStatus('Prev no migrado aún: lógica del flujo principal sigue en el HTML original.');
      });
    }

    if (ui.next) {
      ui.next.addEventListener('click', () => {
        setStatus('Next no migrado aún: lógica del flujo principal sigue en el HTML original.');
      });
    }
  }

  function bindVolumeAndPan() {
    if (ui.vol) {
      ui.vol.addEventListener('input', () => {
        const value = engine.setVolume(ui.vol.value);
        state.settings.volume = value;
        saveSettings(state.settings);
        const pct = document.querySelector('#volpct');
        if (pct) pct.textContent = `${value}%`;
      });
    }

    if (ui.pan) {
      ui.pan.addEventListener('input', () => {
        const value = engine.setPan(ui.pan.value);
        state.settings.pan = value;
        saveSettings(state.settings);
        const label = document.querySelector('#panlbl');
        if (label) {
          label.textContent = value === 0 ? 'Centro' : value < 0 ? `L ${Math.abs(value)}%` : `R ${value}%`;
        }
      });
    }
  }

  function bindSeek() {
    if (ui.seek) {
      ui.seek.addEventListener('input', () => {
        const value = Number(ui.seek.value) || 0;
        if (ui.time) ui.time.textContent = engine.getTimeLabel(value, state.countdown);
      });

      ui.seek.addEventListener('change', () => {
        audio.currentTime = Number(ui.seek.value) || 0;
      });
    }
  }

  function bindAudioLifecycle() {
    audio.addEventListener('play', () => {
      if (ui.play) ui.play.textContent = '⏸';
    });

    audio.addEventListener('pause', () => {
      if (ui.play) ui.play.textContent = '▶';
    });

    audio.addEventListener('loadedmetadata', () => {
      if (ui.seek) ui.seek.max = String(audio.duration || 0);
      if (ui.dur) ui.dur.textContent = `de ${engine.getTimeLabel(audio.duration || 0)}`;
      if (ui.time) ui.time.textContent = engine.getTimeLabel(audio.currentTime || 0, state.countdown);
    });

    audio.addEventListener('timeupdate', () => {
      if (ui.seek && !ui.seek.matches(':active')) ui.seek.value = String(audio.currentTime || 0);
      if (ui.time) ui.time.textContent = engine.getTimeLabel(audio.currentTime || 0, state.countdown);
    });
  }

  function bindVisualizer() {
    const canvas = ui.viz;
    if (!canvas) return;

    const visFactory = async () => {
      const { createVisualizer } = await import('../audio/visualizer.js');
      return createVisualizer;
    };

    let vis = null;

    function tick() {
      if (!vis) {
        visFactory().then((createVisualizer) => {
          const lineColor = getComputedStyle(canvas).getPropertyValue('--lcd-txt').trim() || '#3dff7a';
          vis = createVisualizer(canvas, engine.analyser, { lineColor });
        });
      }

      if (!vis) {
        requestAnimationFrame(tick);
        return;
      }

      const width = canvas.clientWidth || 100;
      const height = canvas.clientHeight || 90;
      const mode = state.settings.vizMode || 'bars';

      if (mode === 'scope') vis.drawScope(width, height);
      else if (mode === 'vu') vis.drawVU(width, height);
      else vis.drawBars(width, height);

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  updateVolumeUI();
  updatePanUI();
  bindPlayback();
  bindVolumeAndPan();
  bindSeek();
  bindAudioLifecycle();
  bindVisualizer();

  window.AudioTechRuntime = {
    state,
    audio,
    engine,
    setStatus,
    save: () => saveSettings(state.settings)
  };

  return window.AudioTechRuntime;
}

window.AudioTechApp = {
  initApp
};
