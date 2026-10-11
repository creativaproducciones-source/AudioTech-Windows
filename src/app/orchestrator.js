import { saveSettings } from '../state/store.js';
import { createAudioEngine } from '../audio/manager.js';

export function createPlayerRuntime({ audio, settings, ui, onStatus = () => {} }) {
  const engine = createAudioEngine(audio, { settings, onStatus });
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

  const setStatus = (message) => {
    if (ui.status) ui.status.textContent = message;
    onStatus(message);
  };

  const setTimeLabel = (seconds) => {
    if (ui.time) {
      ui.time.textContent = engine.getTimeLabel(seconds, state.countdown);
    }
  };

  const updateVolumeUi = () => {
    const value = Number(state.settings.volume || 80);
    if (ui.vol) ui.vol.value = value;
    const label = document.querySelector('#volpct');
    if (label) label.textContent = `${value}%`;
  };

  const updatePanUi = () => {
    const value = Number(state.settings.pan || 0);
    if (ui.pan) ui.pan.value = value;
    const label = document.querySelector('#panlbl');
    if (label) {
      label.textContent = value === 0 ? 'Centro' : value < 0 ? `L ${Math.abs(value)}%` : `R ${value}%`;
    }
  };

  const bindPlayback = () => {
    if (ui.play) {
      ui.play.addEventListener('click', async () => {
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
        setTimeLabel(0);
      });
    }

    if (ui.prev) {
      ui.prev.addEventListener('click', () => {
        setStatus('Prev migrado al runtime modular. La lógica de cola completa sigue en la app principal.');
      });
    }

    if (ui.next) {
      ui.next.addEventListener('click', () => {
        setStatus('Next migrado al runtime modular. La lógica de cola completa sigue en la app principal.');
      });
    }
  };

  const bindVolumeAndPan = () => {
    if (ui.vol) {
      ui.vol.addEventListener('input', () => {
        const value = engine.setVolume(ui.vol.value);
        state.settings.volume = value;
        saveSettings(state.settings);
        updateVolumeUi();
      });
    }

    if (ui.pan) {
      ui.pan.addEventListener('input', () => {
        const value = engine.setPan(ui.pan.value);
        state.settings.pan = value;
        saveSettings(state.settings);
        updatePanUi();
      });
    }
  };

  const bindSeek = () => {
    if (ui.seek) {
      ui.seek.addEventListener('input', () => {
        const value = Number(ui.seek.value) || 0;
        setTimeLabel(value);
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
        setTimeLabel(audio.currentTime || 0);
      });
    }
  };

  const bindLifecycle = () => {
    audio.addEventListener('play', () => {
      if (ui.play) ui.play.textContent = '⏸';
    });

    audio.addEventListener('pause', () => {
      if (ui.play) ui.play.textContent = '▶';
    });

    audio.addEventListener('loadedmetadata', () => {
      if (ui.seek) ui.seek.max = String(audio.duration || 0);
      if (ui.dur) ui.dur.textContent = `de ${engine.getTimeLabel(audio.duration || 0)}`;
      setTimeLabel(audio.currentTime || 0);
    });

    audio.addEventListener('timeupdate', () => {
      if (ui.seek && !ui.seek.matches(':active')) ui.seek.value = String(audio.currentTime || 0);
      setTimeLabel(audio.currentTime || 0);
    });
  };

  const bindVisualizer = () => {
    const canvas = ui.viz;
    if (!canvas || !engine.analyser) return;

    const draw = () => {
      const { createVisualizer } = window.AudioTechAudio || {};
      if (!createVisualizer) return;

      if (!canvas.__visualizer) {
        const lineColor = getComputedStyle(canvas).getPropertyValue('--lcd-txt').trim() || '#3dff7a';
        canvas.__visualizer = createVisualizer(canvas, engine.analyser, { lineColor });
      }

      const width = canvas.clientWidth || 100;
      const height = canvas.clientHeight || 90;
      const mode = state.settings.vizMode || 'bars';

      if (mode === 'scope') canvas.__visualizer.drawScope(width, height);
      else if (mode === 'vu') canvas.__visualizer.drawVU(width, height);
      else canvas.__visualizer.drawBars(width, height);

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  };

  const init = () => {
    updateVolumeUi();
    updatePanUi();
    bindPlayback();
    bindVolumeAndPan();
    bindSeek();
    bindLifecycle();
    bindVisualizer();
  };

  init();

  return {
    state,
    engine,
    setStatus,
    setTimeLabel,
    save: () => saveSettings(state.settings)
  };
}
