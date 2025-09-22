import { createCanvas } from 'canvas';

export default function handler(req, res) {
  const { end, w = 800, h = 300, bg = '140231', fg = 'ffffff', box = 'ffffff', boxfg = '140231' } = req.query;

  const width = parseInt(w, 10);
  const height = parseInt(h, 10);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = `#${bg}`;
  ctx.fillRect(0, 0, width, height);

  // Time difference
  const endDate = new Date(end);
  const now = new Date();
  let diff = Math.max(0, endDate - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);

  const labels = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS'];
  const values = [days, hours, minutes, seconds];

  // Box sizes
  const boxWidth = width / 4 - 20;
  const boxHeight = height * 0.6;
  const startX = 20;
  const startY = height * 0.2;

  ctx.textAlign = 'center';

  values.forEach((val, i) => {
    const x = startX + i * (boxWidth + 20) + boxWidth / 2;
    const y = startY + boxHeight / 2;

    // Box background
    ctx.fillStyle = `#${box}`;
    ctx.roundRect(startX + i * (boxWidth + 20), startY, boxWidth, boxHeight, 20);
    ctx.fill();

    // Value
    ctx.fillStyle = `#${boxfg}`;
    ctx.font = `${Math.floor(boxHeight / 2.5)}px Inter`;
    ctx.fillText(val.toString().padStart(2, '0'), x, y);

    // Label
    ctx.font = `${Math.floor(boxHeight / 6)}px Inter`;
    ctx.fillText(labels[i], x, y + boxHeight / 3);
  });

  res.setHeader('Content-Type', 'image/png');
  res.send(canvas.toBuffer());
}

// Add helper for rounded corners
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  this.beginPath();
  this.moveTo(x + r, y);
  this.lineTo(x + w - r, y);
  this.quadraticCurveTo(x + w, y, x + w, y + r);
  this.lineTo(x + w, y + h - r);
  this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  this.lineTo(x + r, y + h);
  this.quadraticCurveTo(x, y + h, x, y + h - r);
  this.lineTo(x, y + r);
  this.quadraticCurveTo(x, y, x + r, y);
  this.closePath();
  return this;
};
