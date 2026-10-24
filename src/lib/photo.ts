export const PHOTO_SIZE_PX = 360
/** Rendered size of the header photo in the preview and exports. */
export const PHOTO_DISPLAY_PX = 120
const MAX_FILE_BYTES = 10 * 1024 * 1024

export class PhotoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PhotoError'
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new PhotoError('This image could not be read.'))
    img.src = src
  })
}

function createCanvas(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new PhotoError('Your browser cannot process images.')
  return { canvas, ctx }
}

/**
 * Reads an image file, center-crops it to a square and downsizes it so it
 * stays small enough to keep in localStorage and JSON exports.
 */
export async function readPhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError('Please choose an image file.')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new PhotoError('Please choose an image under 10 MB.')
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    if (!side) throw new PhotoError('This image could not be read.')
    const sx = (img.naturalWidth - side) / 2
    const sy = (img.naturalHeight - side) / 2

    const { canvas, ctx } = createCanvas(PHOTO_SIZE_PX)
    // JPEG has no alpha; fill white so transparent PNGs don't turn black
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, PHOTO_SIZE_PX, PHOTO_SIZE_PX)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, side, side, 0, 0, PHOTO_SIZE_PX, PHOTO_SIZE_PX)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl)
  return new Uint8Array(await res.arrayBuffer())
}
