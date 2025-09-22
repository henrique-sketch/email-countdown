import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { DateTime } from 'luxon';

// Try to register a default system font (safe fallback)
try {
  GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans');
} catch {}

function hexToRgb(hex) {
  const h = (hex || '140231').replace('#','');
  const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}
function fill(ctx, hex) {
  const {r,g,b} = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
}
function roundRect(ctx, x, y, w, h, r=16) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

export default async function handler(req, res) {
  try {
    const {
      end,                 // ISO end time, e.g. 2025-10-02T18:00:00Z
      tz = 'UTC',          // IANA tz, e.g. Europe/Lisbon
      w = '1200',
      h = '480',
      bg = '140231',       // background color
      fg = 'ffffff',       // title color
      box = 'ffffff',      // box background
      boxfg = '140231',    // numbers & labels color
      title = '',
      font = 'DejaVuSans', // use Inter if you later add it
      cb                    // cache buster (unused in code, but helpful client-side)
    } = req.query;

    const now = DateTime.now().setZone(tz);
    const endDt = end ? DateTime.fromISO(end).setZone(tz) : now;
    const diff = endDt.diff(now, ['days','hours','minutes','seconds']).toObject();

    const clamp = v => Math.max(0, Math.floor(v || 0));
    const d = clamp(diff.days);
    const hh = clamp(diff.hours);
    const mm = clamp(diff.minutes);
    const ss = clamp(diff.seconds);

    const width = Math.max(800, parseInt(w,10));
    const height = Math.max(320, parseInt(h,10));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    fill(ctx, bg); ctx.fillRect(0,0,width,height);

    // Title
    if (title) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      let size = Math.round(height * 0.11);
      ctx.font = `bold ${size}px "${font}", sans-serif`;
      fill(ctx, fg);
      const maxTitleWidth = width * 0.9;
      while (size > 16 && ctx.measureText(title).width > maxTitleWidth) {
        size -= 2; ctx.font = `bold ${size}px "${font}", sans-serif`;
      }
      ctx.fillText(title, width/2, Math.round(height*0.08));
    }

    // Boxes
    const top = title ? Math.round(height*0.33) : Math.round(height*0.18);
    const boxW = Math.round(width*0.18);
    const boxH = Math.round(height*0.44);
    const gap  = Math.round(width*0.035);
    const startX = Math.round((width - (boxW*4 + gap*3)) / 2);

    const items = [
      {label:'DAYS', value:d},
      {label:'HOURS', value:hh},
      {label:'MINUTES', value:mm},
      {label:'SECONDS', value:ss}
    ];

    items.forEach((it, i)=>{
      const x = startX + i*(boxW+gap);
      const y = top;

      // Box
      roundRect(ctx, x, y, boxW, boxH, 20);
      fill(ctx, box); ctx.fill();

      // Value
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `bold ${Math.round(boxH*0.46)}px "${font}", sans-serif`;
      fill(ctx, boxfg);
      const val = String(it.value).padStart(2,'0');
      ctx.fillText(val, x + boxW/2, y + Math.round(boxH*0.62));

      // Divider
      ctx.globalAlpha = 0.25;
      fill(ctx, boxfg);
      ctx.fillRect(x + Math.round(boxW*0.08), y + Math.round(boxH*0.56), Math.round(boxW*0.84), 2);
      ctx.globalAlpha = 1;

      // Label
      ctx.textBaseline = 'top';
      ctx.font = `600 ${Math.round(boxH*0.14)}px "${font}", sans-serif`;
      ctx.fillText(it.label, x + boxW/2, y + Math.round(boxH*0.64));
    });

    res.setHeader('Content-Type', 'image/png');
    // Avoid caching in your tests; for campaigns, add &cb=... to the URL.
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(canvas.toBuffer('image/png'));
  } catch (e) {
    res.status(500).send(`Error: ${e?.message || e}`);
  }
}
