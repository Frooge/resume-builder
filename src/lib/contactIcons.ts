import type { ContactItemKey } from './contactLinks'

/** Icons are drawn in a 24×24 box. */
export const CONTACT_ICON_VIEWBOX = 24

/** The preview's `text-zinc-600`, shared so every renderer tints icons alike. */
export const CONTACT_ICON_RGB: [number, number, number] = [82, 82, 91]

/**
 * One path per contact item, shared by all three renderers. Written with
 * absolute M/L/C/Z commands only (no arcs or shorthand), so the PDF can replay
 * them through jsPDF's path API with `iconPathOps`.
 */
export const CONTACT_ICON_PATHS: Record<ContactItemKey, string> = {
  location:
    'M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.619 11.5 9.5 10.381 9.5 9C9.5 7.619 10.619 6.5 12 6.5C13.381 6.5 14.5 7.619 14.5 9C14.5 10.381 13.381 11.5 12 11.5Z',
  email:
    'M20 4L4 4C2.9 4 2 4.9 2 6L2 18C2 19.1 2.9 20 4 20L20 20C21.1 20 22 19.1 22 18L22 6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8L4 6L12 11L20 6L20 8Z',
  phone:
    'M6.6 10.8C8 13.6 10.4 15.9 13.2 17.4L15.4 15.2C15.7 14.9 16.1 14.8 16.5 15C17.7 15.4 19 15.6 20.3 15.6C20.9 15.6 21.3 16 21.3 16.6L21.3 20C21.3 20.6 20.9 21 20.3 21C10.6 21 3 13.4 3 4C3 3.4 3.4 3 4 3L7.5 3C8.1 3 8.5 3.4 8.5 4C8.5 5.3 8.7 6.6 9.1 7.8C9.2 8.2 9.1 8.6 8.8 8.9L6.6 10.8Z',
  linkedin:
    'M19 3L5 3C3.895 3 3 3.895 3 5L3 19C3 20.105 3.895 21 5 21L19 21C20.105 21 21 20.105 21 19L21 5C21 3.895 20.105 3 19 3ZM8.3 18.3L5.7 18.3L5.7 9.7L8.3 9.7L8.3 18.3ZM7 8.4C6.172 8.4 5.5 7.728 5.5 6.9C5.5 6.072 6.172 5.4 7 5.4C7.828 5.4 8.5 6.072 8.5 6.9C8.5 7.728 7.828 8.4 7 8.4ZM18.3 18.3L15.7 18.3L15.7 14.1C15.7 13.1 15.3 12.4 14.2 12.4C13.4 12.4 12.9 12.9 12.7 13.4C12.6 13.6 12.6 13.9 12.6 14.2L12.6 18.3L9.9 18.3C9.9 18.3 9.95 11.6 9.9 10.9L12.5 10.9L12.5 12C12.8 11.5 13.5 10.7 14.9 10.7C16.7 10.7 18 11.9 18 14.4L18 18.3Z',
  website:
    'M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM18.9 8L16.1 8C15.799 6.852 15.362 5.745 14.8 4.7C16.5 5.306 17.945 6.469 18.9 8ZM12 4C12.7 4 14 5.7 14.6 8L9.4 8C10 5.7 11.3 4 12 4ZM4.3 14C3.961 12.688 3.961 11.312 4.3 10L7.5 10C7.343 11.329 7.343 12.671 7.5 14L4.3 14ZM5.1 16L7.9 16C8.2 17.2 8.6 18.4 9.2 19.3C7.5 18.694 6.055 17.531 5.1 16ZM8.1 8L5.1 8C6.055 6.469 7.5 5.306 9.2 4.7C8.707 5.754 8.337 6.861 8.1 8ZM12 20C11.3 20 10 18.3 9.4 16L14.6 16C14 18.3 12.7 20 12 20ZM14.7 14L9.3 14C9.121 12.673 9.121 11.327 9.3 10L14.7 10C14.879 11.327 14.879 12.673 14.7 14ZM14.8 19.3C15.4 18.4 15.8 17.2 16.1 16L18.9 16C17.945 17.531 16.5 18.694 14.8 19.3ZM16.7 14L19.7 14C20.039 12.688 20.039 11.312 19.7 10L16.7 10C16.857 11.329 16.857 12.671 16.7 14Z',
}

export type IconPathOp =
  | { op: 'M' | 'L'; x: number; y: number }
  | { op: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: 'Z' }

/** Parses the absolute M/L/C/Z subset used by `CONTACT_ICON_PATHS`. */
export function iconPathOps(d: string): IconPathOp[] {
  const ops: IconPathOp[] = []
  for (const [, cmd, args] of d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const n = args.trim() ? args.trim().split(/[\s,]+/).map(Number) : []
    if (cmd === 'Z') ops.push({ op: 'Z' })
    else if (cmd === 'C') {
      const [x1, y1, x2, y2, x, y] = n
      ops.push({ op: 'C', x1, y1, x2, y2, x, y })
    } else ops.push({ op: cmd as 'M' | 'L', x: n[0], y: n[1] })
  }
  return ops
}

/** Rasterises a contact icon to PNG bytes (for the DOCX, which can't take vector paths inline). */
export async function contactIconPng(
  key: ContactItemKey,
  sizePx = 64,
): Promise<Uint8Array> {
  const fill = `rgb(${CONTACT_ICON_RGB.join(',')})`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${CONTACT_ICON_VIEWBOX} ${CONTACT_ICON_VIEWBOX}"><path fill="${fill}" d="${CONTACT_ICON_PATHS[key]}"/></svg>`
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = sizePx
    canvas.height = sizePx
    canvas.getContext('2d')?.drawImage(img, 0, 0, sizePx, sizePx)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    if (!blob) throw new Error('Could not render contact icon')
    return new Uint8Array(await blob.arrayBuffer())
  } finally {
    URL.revokeObjectURL(url)
  }
}
