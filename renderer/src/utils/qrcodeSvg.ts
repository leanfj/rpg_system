import QRCode from './qrcode-vendor/index.js'
import QRErrorCorrectLevel from './qrcode-vendor/QRErrorCorrectLevel.js'

type QrSvgOptions = {
  size?: number
  margin?: number
  darkColor?: string
  lightColor?: string
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const buildQrCodeSvgDataUrl = (text: string, options?: QrSvgOptions): string => {
  const normalizedText = text.trim()
  if (!normalizedText) {
    throw new Error('Texto para QR vazio')
  }

  const qr = new QRCode(-1, QRErrorCorrectLevel.M)
  qr.addData(normalizedText)
  qr.make()

  const moduleCount = qr.getModuleCount()
  const margin = Math.max(0, options?.margin ?? 2)
  const size = Math.max(120, options?.size ?? 220)
  const darkColor = options?.darkColor ?? '#0f172a'
  const lightColor = options?.lightColor ?? '#ffffff'

  const viewBoxSize = moduleCount + margin * 2
  let modules = ''

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.isDark(row, col)) continue
      modules += `<rect x="${col + margin}" y="${row + margin}" width="1" height="1" />`
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" role="img" aria-label="QR Code">` +
    `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${escapeXml(lightColor)}" />` +
    `<g fill="${escapeXml(darkColor)}">${modules}</g>` +
    `</svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
