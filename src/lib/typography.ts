import type { FontSizeId, ResumeFontId, ResumeStyle } from '../types/resume'

export const FONT_OPTIONS: { id: ResumeFontId; label: string; css: string; docx: string }[] =
  [
    {
      id: 'georgia',
      label: 'Georgia',
      css: 'Georgia, "Times New Roman", Times, serif',
      docx: 'Georgia',
    },
    {
      id: 'times',
      label: 'Times New Roman',
      css: '"Times New Roman", Times, Georgia, serif',
      docx: 'Times New Roman',
    },
    {
      id: 'garamond',
      label: 'Garamond',
      css: 'Garamond, "Palatino Linotype", Palatino, serif',
      docx: 'Garamond',
    },
    {
      id: 'arial',
      label: 'Arial',
      css: 'Arial, Helvetica, sans-serif',
      docx: 'Arial',
    },
    {
      id: 'calibri',
      label: 'Calibri',
      css: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif',
      docx: 'Calibri',
    },
  ]

export const FONT_SIZE_OPTIONS: { id: FontSizeId; label: string; scale: number }[] =
  [
    { id: 'small', label: 'Small', scale: 0.9 },
    { id: 'medium', label: 'Medium', scale: 1 },
    { id: 'large', label: 'Large', scale: 1.1 },
  ]

export const DEFAULT_RESUME_STYLE: ResumeStyle = {
  fontFamily: 'georgia',
  fontSize: 'medium',
  margins: {
    top: 40,
    right: 48,
    bottom: 40,
    left: 48,
  },
}

/** Fill missing fields for older localStorage payloads. */
export function normalizeResumeStyle(
  style?: Partial<ResumeStyle> | null,
): ResumeStyle {
  return {
    fontFamily: style?.fontFamily ?? DEFAULT_RESUME_STYLE.fontFamily,
    fontSize: style?.fontSize ?? DEFAULT_RESUME_STYLE.fontSize,
    margins: {
      ...DEFAULT_RESUME_STYLE.margins,
      ...style?.margins,
    },
  }
}

/** Base sizes in px at medium scale (matches the original template). */
const BASE = {
  name: 26,
  contactMeta: 10.5,
  sectionHeading: 12,
  body: 11.5,
  roleTitle: 12,
  dates: 10.5,
  muted: 11,
  details: 11,
} as const

export type TypographyScale = { [K in keyof typeof BASE]: number }

export function getFontCss(id: ResumeFontId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.css ?? FONT_OPTIONS[0].css
}

export function getFontDocx(id: ResumeFontId): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.docx ?? 'Times New Roman'
}

export function getFontScale(id: FontSizeId): number {
  return FONT_SIZE_OPTIONS.find((f) => f.id === id)?.scale ?? 1
}

export function scaledTypography(fontSize: FontSizeId): TypographyScale {
  const scale = getFontScale(fontSize)
  return {
    name: BASE.name * scale,
    contactMeta: BASE.contactMeta * scale,
    sectionHeading: BASE.sectionHeading * scale,
    body: BASE.body * scale,
    roleTitle: BASE.roleTitle * scale,
    dates: BASE.dates * scale,
    muted: BASE.muted * scale,
    details: BASE.details * scale,
  }
}

/** DOCX uses half-points (size 22 = 11pt). Base values match the previous export. */
const DOCX_BASE = {
  name: 36,
  contactMeta: 18,
  sectionHeading: 22,
  body: 21,
  roleTitle: 22,
  dates: 18,
  details: 20,
} as const

export type DocxTypographyScale = { [K in keyof typeof DOCX_BASE]: number }

export function scaledDocxTypography(fontSize: FontSizeId): DocxTypographyScale {
  const scale = getFontScale(fontSize)
  return {
    name: Math.round(DOCX_BASE.name * scale),
    contactMeta: Math.round(DOCX_BASE.contactMeta * scale),
    sectionHeading: Math.round(DOCX_BASE.sectionHeading * scale),
    body: Math.round(DOCX_BASE.body * scale),
    roleTitle: Math.round(DOCX_BASE.roleTitle * scale),
    dates: Math.round(DOCX_BASE.dates * scale),
    details: Math.round(DOCX_BASE.details * scale),
  }
}

export function typographyCssVars(
  style: ResumeStyle,
): Record<string, string> {
  const t = scaledTypography(style.fontSize)
  return {
    fontFamily: getFontCss(style.fontFamily),
    ['--fs-name' as string]: `${t.name}px`,
    ['--fs-contact-meta' as string]: `${t.contactMeta}px`,
    ['--fs-section-heading' as string]: `${t.sectionHeading}px`,
    ['--fs-body' as string]: `${t.body}px`,
    ['--fs-role-title' as string]: `${t.roleTitle}px`,
    ['--fs-dates' as string]: `${t.dates}px`,
    ['--fs-muted' as string]: `${t.muted}px`,
    ['--fs-details' as string]: `${t.details}px`,
  }
}
