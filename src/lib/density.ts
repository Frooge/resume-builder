import type { ResumeDensity } from '../types/resume'

/** Spacing in px (96dpi) at scale 1. Shared by preview, PDF and DOCX. */
export interface DensitySpacing {
  sectionGap: number
  entryGap: number
  bulletGap: number
  skillGap: number
  /** Gap between certifications and similar one-line items */
  itemGap: number
  /** Gap between a section rule and its first line */
  headingAfter: number
  /** Gap under the name / contact header rule */
  contactGap: number
  bulletIndent: number
  bodyLeading: number
  bulletLeading: number
  nameScale: number
}

const SPACING: Record<ResumeDensity, DensitySpacing> = {
  normal: {
    sectionGap: 18,
    entryGap: 14,
    bulletGap: 2,
    skillGap: 2,
    itemGap: 6,
    headingAfter: 8,
    contactGap: 12,
    bulletIndent: 18,
    bodyLeading: 1.45,
    bulletLeading: 1.4,
    nameScale: 1,
  },
  compact: {
    sectionGap: 10,
    entryGap: 6,
    bulletGap: 0,
    skillGap: 0,
    itemGap: 3,
    headingAfter: 4,
    contactGap: 6,
    bulletIndent: 14,
    bodyLeading: 1.25,
    bulletLeading: 1.22,
    nameScale: 0.8,
  },
}

/** Gaps shrink with `spacingScale`; leading, indent and name scale do not. */
export function getSpacing(
  density: ResumeDensity,
  spacingScale = 1,
): DensitySpacing {
  const s = SPACING[density] ?? SPACING.normal
  return {
    ...s,
    sectionGap: s.sectionGap * spacingScale,
    entryGap: s.entryGap * spacingScale,
    bulletGap: s.bulletGap * spacingScale,
    skillGap: s.skillGap * spacingScale,
    itemGap: s.itemGap * spacingScale,
    headingAfter: s.headingAfter * spacingScale,
    contactGap: s.contactGap * spacingScale,
  }
}

export interface FitParams {
  spacingScale: number
  fontScale: number
}

export const NO_FIT: FitParams = { spacingScale: 1, fontScale: 1 }

const MIN_SPACING_SCALE = 0.5
/** Body text never shrinks below this (~7.5pt). */
const MIN_BODY_PX = 10

/**
 * Fit ladder: t in [0, 0.5] shrinks spacing to half, then t in [0.5, 1]
 * shrinks fonts until body text reaches MIN_BODY_PX.
 */
export function fitParams(t: number, baseBodyPx: number): FitParams {
  const clamped = Math.min(1, Math.max(0, t))
  const minFont = Math.min(1, MIN_BODY_PX / baseBodyPx)
  if (clamped <= 0.5) {
    return {
      spacingScale: 1 - (1 - MIN_SPACING_SCALE) * (clamped / 0.5),
      fontScale: 1,
    }
  }
  return {
    spacingScale: MIN_SPACING_SCALE,
    fontScale: 1 - (1 - minFont) * ((clamped - 0.5) / 0.5),
  }
}

/** Binary-search rounds for the smallest t that fits one page. */
export const FIT_SEARCH_STEPS = 7

/**
 * Smallest t in [0, 1] for which `fits(t)` holds, assuming fits is monotonic.
 * Returns `{ t: 1, fits: false }` when even the tightest setting overflows.
 */
export function searchFit(fits: (t: number) => boolean): {
  t: number
  fits: boolean
} {
  if (fits(0)) return { t: 0, fits: true }
  if (!fits(1)) return { t: 1, fits: false }
  let lo = 0
  let hi = 1
  for (let i = 0; i < FIT_SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) hi = mid
    else lo = mid
  }
  return { t: hi, fits: true }
}
