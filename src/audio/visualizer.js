export function createVisualizer(canvas, analyser, options = {}) {
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(128);
  const scopeBuf = new Uint8Array(256);
  const leftBuf = new Uint8Array(512);
  const rightBuf = new Uint8Array(512);
  const segmentCount = options.segmentCount ?? 24;
  const lineColor = options.lineColor ?? '#3dff7a';

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawBars(width, height) {
    if (analyser) analyser.getByteFrequencyData(data);
    else data.fill(0);

    const bars = 48;
    const barWidth = width / bars;

    for (let i = 0; i < bars; i += 1) {
      const value = data[Math.floor((i * data.length) / bars)] / 255;
      const barHeight = Math.max(2, value * height);
      const x = i * barWidth + 1;
      const y = height - barHeight;

      ctx.fillStyle = value > 0.8 ? '#ff4d4d' : value > 0.55 ? '#e9b949' : '#3dff7a';
      ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
  }

  function drawScope(width, height) {
    if (analyser) analyser.getByteTimeDomainData(scopeBuf); else scopeBuf.fill(128);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColor;

    for (let i = 0; i < scopeBuf.length; i += 1) {
      const x = (i / (scopeBuf.length - 1)) * width;
      const y = (scopeBuf[i] / 255) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  function drawVU(width, height) {
    if (!analyser) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const getPeak = (buffer, channel) => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const normalized = (buffer[i] - 128) / 128;
        sum += normalized * normalized;
      }
      return Math.min(1, Math.sqrt(sum / buffer.length) * 2.5);
    };

    const left = getPeak(leftBuf, 0);
    const right = getPeak(rightBuf, 1);
    const bandWidth = width / segmentCount;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < segmentCount; i += 1) {
      const x = i * bandWidth + 2;
      const segmentLeft = Math.max(2, Math.min(height, (left * height) * ((i + 1) / segmentCount)));
      const segmentRight = Math.max(2, Math.min(height, (right * height) * ((i + 1) / segmentCount)));

      ctx.fillStyle = '#3dff7a';
      ctx.fillRect(x, height - segmentLeft, bandWidth - 4, segmentLeft);

      ctx.fillStyle = '#e9b949';
      ctx.fillRect(x, height - segmentRight, bandWidth - 4, segmentRight);
    }
  }

  return {
    resize,
    drawBars,
    drawScope,
    drawVU
  };
}
