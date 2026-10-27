// Generates the PWA icons (no dependencies): node tools/make-icons.js
// Design: Classical bg, accent ring, accent-700 "arrow-down-up" mark.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [0xf3, 0xf2, 0xf2], RING = [0xb6, 0x82, 0x35], MARK = [0x7d, 0x54, 0x11];

// Shapes in unit space (0..1). Ring sits inside the maskable safe zone (r < 0.4).
const segs = [
  // up arrow (left): shaft + head
  [0.42, 0.66, 0.42, 0.34], [0.42, 0.34, 0.355, 0.405], [0.42, 0.34, 0.485, 0.405],
  // down arrow (right)
  [0.58, 0.34, 0.58, 0.66], [0.58, 0.66, 0.515, 0.595], [0.58, 0.66, 0.645, 0.595],
];
function segDist(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}
function colorAt(x, y) {
  if (Math.min(...segs.map(s => segDist(x, y, s))) < 0.022) return MARK;
  if (Math.abs(Math.hypot(x - 0.5, y - 0.5) - 0.3) < 0.012) return RING;
  return BG;
}

function png(size) {
  const SS = 4; // supersampling for anti-aliasing
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = colorAt((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
      }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(acc[i] / (SS * SS));
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
  });
  const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  fs.writeFileSync(path.join(out, name), png(size));
  console.log('wrote', name);
}
