// Generates simple branded PWA icons (PNG) without external dependencies.
// Run: node scripts/generate-icons.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICON_DIR = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(ICON_DIR)) fs.mkdirSync(ICON_DIR, { recursive: true });

// CRC32 for PNG chunks
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Creates a PNG: green rounded background, gold circle (Bangladesh flag motif).
 */
function createIcon(size) {
  const width = size;
  const height = size;
  const bytesPerPixel = 4; // RGBA
  const raw = Buffer.alloc(height * (1 + width * bytesPerPixel));

  const cx = width / 2;
  const cy = height / 2;
  const bgRadius = width * 0.22; // rounded-corner radius
  const flagRadius = width * 0.28; // gold circle radius

  function inRoundedRect(x, y) {
    const dx = Math.max(bgRadius - x, x - (width - 1 - bgRadius), 0);
    const dy = Math.max(bgRadius - y, y - (height - 1 - bgRadius), 0);
    return dx * dx + dy * dy <= bgRadius * bgRadius || (x >= bgRadius && x <= width - 1 - bgRadius) || (y >= bgRadius && y <= height - 1 - bgRadius);
  }

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * bytesPerPixel);
    raw[rowStart] = 0; // filter byte: none
    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * bytesPerPixel;
      const dx = x - cx + width * 0.04; // circle slightly left like the flag
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 4, g = 120, b = 87, a = 255; // #047857 green
      if (!inRoundedRect(x, y)) {
        a = 0; // transparent outside rounded corners
      } else if (dist <= flagRadius) {
        r = 251; g = 191; b = 36; // #fbbf24 gold
      }
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512, 180]) {
  const file = path.join(ICON_DIR, `icon-${size}.png`);
  fs.writeFileSync(file, createIcon(size));
  console.log(`Created ${file}`);
}
