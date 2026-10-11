export function createQueueRenderer({
  listEl,
  getTrackDisplayName,
  formatDuration,
  onSelect,
  onDoubleClick,
  onRemove,
  onMove,
  onToggleUpNext,
  onRename
}) {
  function render({ queue = [], currentIndex = -1, selectedTrack = null, upNextTrack = null, filterValue = 'all' }) {
    if (!listEl) return;

    listEl.innerHTML = '';

    queue.forEach((track, index) => {
      if (filterValue && filterValue !== 'all' && !matchesQueueFilter(track, filterValue)) return;

      const item = document.createElement('li');
      item.dataset.index = String(index);
      item.draggable = true;

      if (index === currentIndex) item.classList.add('current');
      if (selectedTrack && track === selectedTrack) item.classList.add('selected');
      if (upNextTrack && track === upNextTrack) item.classList.add('up-next');

      const idx = document.createElement('span');
      idx.className = 'idx';
      idx.textContent = String(index + 1);

      const name = document.createElement('span');
      name.className = 'nm';
      name.textContent = getTrackDisplayName(track);

      const len = document.createElement('span');
      len.className = 'len';
      len.textContent = formatDuration(Number(track && track.duration) || 0);

      const renameButton = document.createElement('button');
      renameButton.className = 'ren';
      renameButton.type = 'button';
      renameButton.title = 'Editar nombre';
      renameButton.textContent = '✎';
      renameButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onRename?.(track, index);
      });

      const nextButton = document.createElement('button');
      nextButton.className = 'nx';
      nextButton.type = 'button';
      nextButton.title = 'Marcar como siguiente';
      nextButton.textContent = 'S';
      if (upNextTrack && track === upNextTrack) nextButton.classList.add('on');
      nextButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onToggleUpNext?.(track, index);
      });

      const removeButton = document.createElement('button');
      removeButton.className = 'x';
      removeButton.type = 'button';
      removeButton.title = 'Quitar de la lista';
      removeButton.textContent = '✕';
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onRemove?.(index);
      });

      item.appendChild(idx);
      item.appendChild(name);
      item.appendChild(len);
      item.appendChild(renameButton);
      item.appendChild(nextButton);
      item.appendChild(removeButton);

      item.addEventListener('click', () => onSelect?.({ track, index }));
      item.addEventListener('dblclick', () => onDoubleClick?.({ track, index }));

      item.addEventListener('dragstart', (event) => {
        event.dataTransfer?.setData('text/plain', String(index));
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (event) => {
        event.preventDefault();
        item.classList.add('drop-target');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-target');
      });

      item.addEventListener('drop', (event) => {
        event.preventDefault();
        item.classList.remove('drop-target');
        const fromIndex = Number(event.dataTransfer?.getData('text/plain') ?? -1);
        if (Number.isInteger(fromIndex) && fromIndex >= 0 && fromIndex !== index) {
          onMove?.(fromIndex, index);
        }
      });

      listEl.appendChild(item);
    });
  }

  function matchesQueueFilter(track, filterValue) {
    if (!track || filterValue === 'all') return true;

    const duration = Number(track.duration) || 0;
    const bitrate = Number(track.bitrate ?? 0);

    if (filterValue === 'hq') {
      return bitrate >= 320 || (!bitrate && duration > 0);
    }

    if (filterValue === 'lq') {
      return bitrate > 0 ? bitrate < 320 : false;
    }

    return true;
  }

  return { render };
}
