export function createPlayerFlow({ audio, settings, onStatus = () => {} }) {
  const state = {
    queue: Array.isArray(settings.queue) ? settings.queue : [],
    currentIndex: -1,
    shuffle: Boolean(settings.shuffle),
    repeat: settings.repeat || 'off',
    countdown: Boolean(settings.countdown),
    upNext: null,
    onStatus
  };

  function setStatus(message) {
    state.onStatus(message);
  }

  function getCurrentTrack() {
    return state.queue[state.currentIndex] || null;
  }

  function loadTrack(index, autoplay = false) {
    if (!state.queue.length || index < 0 || index >= state.queue.length) return false;

    state.currentIndex = index;
    const track = state.queue[index];

    if (track && track.url) {
      audio.src = track.url;
    } else if (track && track.file) {
      audio.src = URL.createObjectURL(track.file);
    }

    settings.lastId = track?.id ?? null;
    settings.pos = 0;
    try {
      localStorage.setItem('reproductor-ajustes', JSON.stringify(settings));
    } catch (error) {
      console.warn('[playerFlow] unable to save settings', error);
    }

    if (autoplay) {
      audio.play().catch(() => setStatus('No se pudo reproducir la pista actual.'));
    }

    return true;
  }

  function next(manual = false) {
    if (!state.queue.length) return false;

    const pickIdx = state.upNext ? state.queue.indexOf(state.upNext) : -1;
    let nextIndex = -1;

    if (!manual && state.repeat === 'one') {
      nextIndex = state.currentIndex;
    } else if (pickIdx >= 0 && pickIdx !== state.currentIndex) {
      nextIndex = pickIdx;
    } else if (state.shuffle && state.queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      } while (nextIndex === state.currentIndex && state.queue.length > 1);
    } else if (state.currentIndex + 1 < state.queue.length) {
      nextIndex = state.currentIndex + 1;
    } else if (state.repeat === 'all' || manual) {
      nextIndex = 0;
    }

    if (nextIndex < 0) {
      audio.pause();
      return false;
    }

    if (pickIdx >= 0 && (nextIndex === pickIdx || pickIdx === state.currentIndex)) {
      state.upNext = null;
    }

    return loadTrack(nextIndex, true);
  }

  function prev() {
    if (!state.queue.length) return false;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return true;
    }

    const target = state.currentIndex > 0 ? state.currentIndex - 1 : state.queue.length - 1;
    return loadTrack(target, true);
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    settings.shuffle = state.shuffle;
    try {
      localStorage.setItem('reproductor-ajustes', JSON.stringify(settings));
    } catch (error) {
      console.warn('[playerFlow] unable to save shuffle state', error);
    }
    return state.shuffle;
  }

  function cycleRepeat() {
    const cycle = { off: 'all', all: 'one', one: 'off' };
    state.repeat = cycle[state.repeat] || 'off';
    settings.repeat = state.repeat;
    try {
      localStorage.setItem('reproductor-ajustes', JSON.stringify(settings));
    } catch (error) {
      console.warn('[playerFlow] unable to save repeat state', error);
    }
    return state.repeat;
  }

  function setQueue(queueItems = []) {
    state.queue = Array.isArray(queueItems) ? queueItems : [];
    if (!state.queue.length) state.currentIndex = -1;
    else if (state.currentIndex < 0) state.currentIndex = 0;
    settings.queue = state.queue.map((track) => track.id).filter((id) => typeof id === 'number');
    return state.queue;
  }

  function setUpNext(track) {
    state.upNext = track || null;
    return state.upNext;
  }

  function removeFromQueue(index) {
    if (index < 0 || index >= state.queue.length) return state.queue;
    state.queue.splice(index, 1);

    if (state.currentIndex >= state.queue.length) {
      state.currentIndex = state.queue.length - 1;
    }

    if (state.currentIndex < 0) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    return state.queue;
  }

  function clearQueue() {
    state.queue = [];
    state.currentIndex = -1;
    state.upNext = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    return state.queue;
  }

  return {
    state,
    getCurrentTrack,
    loadTrack,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    setQueue,
    setUpNext,
    removeFromQueue,
    clearQueue,
    setStatus
  };
}
