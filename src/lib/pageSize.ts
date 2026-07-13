/** A4 at 96dpi */
export const PAGE_WIDTH_PX = 794
export const PAGE_HEIGHT_PX = 1123

/** Safety margin so rounding / subpixel wrap doesn't clip past page margins */
export const PAGE_PACK_BUFFER_PX = 40

export const PAGE_GAP_PX = 24

export function pageContentHeight(marginTop: number, marginBottom: number): number {
  return PAGE_HEIGHT_PX - marginTop - marginBottom
}

export function pageContentWidth(marginLeft: number, marginRight: number): number {
  return PAGE_WIDTH_PX - marginLeft - marginRight
}

/** Convert CSS px (96dpi) to DOCX twips (1440/inch). */
export function pxToTwip(px: number): number {
  return Math.round(px * 15)
}
