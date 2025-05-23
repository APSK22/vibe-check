const canvas = document.createElement('canvas');
canvas.width = canvas.height = 64;
const ctx = canvas.getContext('2d');
const favicon = document.getElementById('favicon');

let t = 0;
function draw() {
  ctx.fillStyle = "#0c0c0c";
  ctx.fillRect(0, 0, 64, 64);

  ctx.beginPath();
  for (let x = 0; x < 64; x++) {
    const y = 32 + 10 * Math.sin((x + t) * 0.2);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#00ffc3";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#00ffc3";
  ctx.stroke();

  favicon.href = canvas.toDataURL('image/png');
  t += 1;
  requestAnimationFrame(draw);
}

draw(); 