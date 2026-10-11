import { loadSettings, saveSettings } from '../state/store.js';
import { createAudioEngine } from '../audio/manager.js';
import { createPlayerFlow } from './playerFlow.js';

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

  const ui = {
    play: document.querySelector('#play'),
    prev: document.querySelector('#prev'),
    next: document.querySelector('#next'),
    stop: document.querySelector('#stop'),
    shuffle: document.querySelector('#shuffle'),
    repeat: document.querySelector('#repeat'),
    seek: document.querySelector('#seek'),
    vol: document.querySelector('#vol'),
    pan: document.querySelector('#pan'),
    time: document.querySelector('#time'),
    dur: document.querySelector('#dur'),
    status: document.querySelector('#status'),
    viz: document.querySelector('#viz'),
    preset: document.querySelector('#preset')
  };

  const player = createPlayerFlow({
    audio,
    settings,
    onStatus: (message) => {
      if (ui.status) ui.status.textContent = message;
    }
  });

  const state = {
    settings,
    audio,
    engine,
    player,
    countdown: Boolean(settings.countdown),
    queue: player.state.queue,
    currentIndex: player.state.currentIndex,
    shuffle: player.state.shuffle,
    repeat: player.state.repeat
  };

  function setStatus(message) {
    if (ui.status) ui.status.textContent = message;
    player.setStatus(message);
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

  function refreshRepeatToggle() {
    if (!ui.repeat) return;
    ui.repeat.textContent = { off: '🔁', all: '🔁 ∞', one: '🔂' }[player.state.repeat || 'off'];
    ui.repeat.classList.toggle('on', player.state.repeat !== 'off');
  }

  function refreshShuffleToggle() {
    if (!ui.shuffle) return;
    ui.shuffle.classList.toggle('on', player.state.shuffle);
  }

  function bindPlayback() {
    if (ui.play) {
      ui.play.addEventListener('click', async () => {
        if (!audio.src && player.state.queue.length) {
          player.loadTrack(player.state.currentIndex >= 0 ? player.state.currentIndex : 0, true);
          return;
        }

        if (!audio.src) {
          setStatus('No hay una pista cargada.');
          return;
        }

        if (audio.paused) {
          const ok = await engine.play();
          if (ok && ui.play) ui.play.textContent = '⏸';
          return;
        }

        engine.pause();
        if (ui.play) ui.play.textContent = '▶';
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
      ui.prev.addEventListener('click', () => player.prev());
    }

    if (ui.next) {
      ui.next.addEventListener('click', () => player.next(true));
    }

    if (ui.shuffle) {
      ui.shuffle.addEventListener('click', () => {
        player.toggleShuffle();
        refreshShuffleToggle();
      });
    }

    if (ui.repeat) {
      ui.repeat.addEventListener('click', () => {
        player.cycleRepeat();
        refreshRepeatToggle();
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

    if (ui.time) {
      ui.time.addEventListener('click', () => {
        state.countdown = !state.countdown;
        state.settings.countdown = state.countdown;
        saveSettings(state.settings);
        if (ui.time) ui.time.textContent = engine.getTimeLabel(audio.currentTime || 0, state.countdown);
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

    audio.addEventListener('ended', () => player.next(false));
  }

  function bindVisualizer() {
    const canvas = ui.viz;
    if (!canvas) return;

    let vis = null;

    const prepareVis = async () => {
      const { createVisualizer } = await import('../audio/visualizer.js');
      const lineColor = getComputedStyle(canvas).getPropertyValue('--lcd-txt').trim() || '#3dff7a';
      vis = createVisualizer(canvas, engine.analyser, { lineColor });
    };

    function tick() {
      if (!vis && engine.analyser) {
        prepareVis();
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

  refreshRepeatToggle();
  refreshShuffleToggle();
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
    player,
    setStatus,
    save: () => saveSettings(state.settings)
  };

  return window.AudioTechRuntime;
}

window.AudioTechApp = {
  initApp
};
