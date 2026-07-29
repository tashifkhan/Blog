/**
 * Generate Pressroom favicons + PWA icons from an SVG mark matching the masthead.
 *
 * Outputs:
 *   public/favicon.svg
 *   public/favicon.ico          (16 + 32 + 48)
 *   public/icons/favicon-16x16.png
 *   public/icons/favicon-32x32.png
 *   public/icons/favicon-48x48.png
 *   public/icons/apple-touch-icon.png          (180)
 *   public/icons/apple-touch-icon-152x152.png  (iPad)
 *   public/icons/apple-touch-icon-167x167.png  (iPad Pro)
 *   public/icons/pwa-192x192.png
 *   public/icons/pwa-512x512.png
 *   public/icons/pwa-maskable-512x512.png
 *   public/icons/safari-pinned-tab.svg         (monochrome)
 *
 * Run: bun run icons
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const iconsDir = join(publicDir, 'icons')
mkdirSync(iconsDir, { recursive: true })

const paper = '#f3efe4'
const ink = '#171711'
const red = '#c43d2f'
const darkPaper = '#141310'

/**
 * Path-based capital P (avoids font fallbacks when sharp rasterizes SVG).
 * ViewBox 0 0 100 100, origin at glyph center-ish for the mark block.
 */
const letterP =
  'M32 18h28c14.5 0 24 8.2 24 21.5S74.5 61 60 61H46v21H32V18zm14 12v19h12c7.2 0 11.5-3.6 11.5-9.5S65.2 30 58 30H46z'

/** Full-bleed brand mark on paper (favicons, apple, any-purpose PWA). */
function brandSvg(size) {
  const pad = size * 0.12
  const mark = size - pad * 2
  const r = Math.max(1.5, size * 0.055)
  const shadow = Math.max(1, size * 0.05)
  // Slightly larger letter inset so small favicons stay legible.
  const glyphPad = mark * 0.1
  const glyph = mark - glyphPad * 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${paper}"/>
  <g transform="translate(${size / 2}, ${size / 2}) rotate(-2)">
    <rect x="${-mark / 2 + shadow}" y="${-mark / 2 + shadow}" width="${mark}" height="${mark}" rx="${r}" fill="${red}"/>
    <rect x="${-mark / 2}" y="${-mark / 2}" width="${mark}" height="${mark}" rx="${r}" fill="${ink}"/>
    <g transform="translate(${-mark / 2 + glyphPad}, ${-mark / 2 + glyphPad}) scale(${glyph / 100})">
      <path d="${letterP}" fill="${paper}"/>
    </g>
  </g>
</svg>`
}

/** Maskable: solid dark field, mark inside ~80% safe zone. */
function maskableSvg(size) {
  const mark = size * 0.55
  const r = Math.max(2, size * 0.04)
  const shadow = size * 0.035
  const glyphPad = mark * 0.1
  const glyph = mark - glyphPad * 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${darkPaper}"/>
  <g transform="translate(${size / 2}, ${size / 2}) rotate(-2)">
    <rect x="${-mark / 2 + shadow}" y="${-mark / 2 + shadow}" width="${mark}" height="${mark}" rx="${r}" fill="${red}"/>
    <rect x="${-mark / 2}" y="${-mark / 2}" width="${mark}" height="${mark}" rx="${r}" fill="${ink}"/>
    <g transform="translate(${-mark / 2 + glyphPad}, ${-mark / 2 + glyphPad}) scale(${glyph / 100})">
      <path d="${letterP}" fill="${paper}"/>
    </g>
  </g>
</svg>`
}

/** Monochrome silhouette for Safari pinned tabs. */
function safariPinnedSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path fill="#000" d="M2.2 1.4h11.6c.6 0 1.1.5 1.1 1.1v11c0 .6-.5 1.1-1.1 1.1H2.2c-.6 0-1.1-.5-1.1-1.1v-11c0-.6.5-1.1 1.1-1.1zm2.6 2.4v8.4h2.1V9.3h1.6c2.1 0 3.4-1.1 3.4-2.8S10.6 3.8 8.5 3.8H4.8zm2.1 1.7h1.4c.9 0 1.5.4 1.5 1.1s-.6 1.1-1.5 1.1H6.9V5.5z"/>
</svg>`
}

async function writePng(path, svg, size) {
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'fill' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  writeFileSync(path, buf)
  console.log('wrote', rel(path), `(${buf.length} B, ${size}×${size})`)
  return buf
}

function rel(path) {
  return path.replace(root + '/', '')
}

/**
 * Build a multi-size .ico with embedded PNG images (Vista+ / all modern browsers).
 * @param {Buffer[]} pngs PNG buffers (same order as sizes)
 */
function pngsToIco(pngs) {
  const count = pngs.length
  const headerSize = 6 + 16 * count
  let offset = headerSize
  const entries = []

  for (const png of pngs) {
    // IHDR: width/height at bytes 16-23 (big-endian)
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    entries.push({
      width: width >= 256 ? 0 : width,
      height: height >= 256 ? 0 : height,
      size: png.length,
      offset,
    })
    offset += png.length
  }

  const ico = Buffer.alloc(offset)
  // ICONDIR
  ico.writeUInt16LE(0, 0) // reserved
  ico.writeUInt16LE(1, 2) // type = icon
  ico.writeUInt16LE(count, 4)

  for (let i = 0; i < count; i++) {
    const e = entries[i]
    const base = 6 + i * 16
    ico.writeUInt8(e.width, base)
    ico.writeUInt8(e.height, base + 1)
    ico.writeUInt8(0, base + 2) // color palette
    ico.writeUInt8(0, base + 3) // reserved
    ico.writeUInt16LE(1, base + 4) // color planes
    ico.writeUInt16LE(32, base + 6) // bits per pixel
    ico.writeUInt32LE(e.size, base + 8)
    ico.writeUInt32LE(e.offset, base + 12)
    pngs[i].copy(ico, e.offset)
  }

  return ico
}

// --- generate ---

const brandMaster = brandSvg(512)
writeFileSync(join(publicDir, 'favicon.svg'), brandMaster)
console.log('wrote public/favicon.svg')

writeFileSync(join(iconsDir, 'safari-pinned-tab.svg'), safariPinnedSvg())
console.log('wrote public/icons/safari-pinned-tab.svg')

// Raster favicons
const png16 = await writePng(join(iconsDir, 'favicon-16x16.png'), brandSvg(16), 16)
const png32 = await writePng(join(iconsDir, 'favicon-32x32.png'), brandSvg(32), 32)
const png48 = await writePng(join(iconsDir, 'favicon-48x48.png'), brandSvg(48), 48)

// Classic multi-res ICO (browsers still request /favicon.ico by default)
const ico = pngsToIco([png16, png32, png48])
writeFileSync(join(publicDir, 'favicon.ico'), ico)
console.log('wrote public/favicon.ico', `(${ico.length} B)`)

// Also keep a root PNG fallback some agents still sniff
await writePng(join(publicDir, 'favicon.png'), brandSvg(32), 32)

// Apple touch icons
await writePng(join(iconsDir, 'apple-touch-icon.png'), brandSvg(180), 180)
await writePng(join(iconsDir, 'apple-touch-icon-152x152.png'), brandSvg(152), 152)
await writePng(join(iconsDir, 'apple-touch-icon-167x167.png'), brandSvg(167), 167)

// PWA / Android
await writePng(join(iconsDir, 'pwa-192x192.png'), brandSvg(192), 192)
await writePng(join(iconsDir, 'pwa-512x512.png'), brandSvg(512), 512)
await writePng(join(iconsDir, 'pwa-maskable-512x512.png'), maskableSvg(512), 512)

console.log('done')
