import { jsPDF } from 'jspdf'
import type { ResumeData, ResumeStyle, SectionId } from '../types/resume'
import { SECTION_LABELS } from '../types/resume'
import { formatDateRange, formatYearRange } from './formatDate'
import { sortEducation, sortExperience } from './sortEntries'
import { PHOTO_DISPLAY_PX } from './photo'
import {
  DEFAULT_RESUME_STYLE,
  getFontPdf,
  scaledTypography,
  type TypographyScale,
} from './typography'

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const PX_PER_INCH = 96
const MM_PER_INCH = 25.4
const PT_PER_PX = 72 / PX_PER_INCH

const SECTION_GAP_MM = pxToMm(18)
const ENTRY_GAP_MM = pxToMm(14)
const TIGHT_GAP_MM = pxToMm(2)
const HEADING_AFTER_MM = pxToMm(8)
const RULE_WIDTH_MM = 0.25

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume'
  )
}

function displayLinkedIn(value: string): string {
  return value
    .replace(/^https?:\/\//, '')
    .replace(/^(www\.)?linkedin\.com\//, '')
}

function displayWebsite(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function pxToMm(px: number): number {
  return (px * MM_PER_INCH) / PX_PER_INCH
}

function fontPt(px: number): number {
  return px * PT_PER_PX
}

function lineHeightMm(sizePx: number, leading = 1.45): number {
  return pxToMm(sizePx * leading)
}

type PdfFont = ReturnType<typeof getFontPdf>

type PdfWriter = {
  doc: jsPDF
  font: PdfFont
  sizes: TypographyScale
  left: number
  right: number
  top: number
  bottom: number
  width: number
  y: number
}

function createWriter(style: ResumeStyle): PdfWriter {
  const sizes = scaledTypography(style.fontSize)
  const left = pxToMm(style.margins.left)
  const right = PAGE_WIDTH_MM - pxToMm(style.margins.right)
  const top = pxToMm(style.margins.top)
  const bottom = PAGE_HEIGHT_MM - pxToMm(style.margins.bottom)

  return {
    doc: new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    }),
    font: getFontPdf(style.fontFamily),
    sizes,
    left,
    right,
    top,
    bottom,
    width: right - left,
    y: top,
  }
}

function setStyle(
  w: PdfWriter,
  opts: {
    size: number
    bold?: boolean
    italic?: boolean
    color?: [number, number, number]
  },
) {
  const style =
    opts.bold && opts.italic
      ? 'bolditalic'
      : opts.bold
        ? 'bold'
        : opts.italic
          ? 'italic'
          : 'normal'
  w.doc.setFont(w.font, style)
  w.doc.setFontSize(fontPt(opts.size))
  w.doc.setTextColor(...(opts.color ?? [39, 39, 42]))
}

function ensureSpace(w: PdfWriter, needed: number) {
  if (w.y + needed <= w.bottom) return
  w.doc.addPage()
  w.y = w.top
}

function drawRule(w: PdfWriter) {
  w.doc.setDrawColor(39, 39, 42)
  w.doc.setLineWidth(RULE_WIDTH_MM)
  w.doc.line(w.left, w.y, w.right, w.y)
  w.y += pxToMm(6)
}

function wrap(w: PdfWriter, text: string, maxWidth = w.width): string[] {
  return w.doc.splitTextToSize(text, maxWidth)
}

function writeLines(
  w: PdfWriter,
  lines: string[],
  opts: {
    size: number
    bold?: boolean
    italic?: boolean
    color?: [number, number, number]
    align?: 'left' | 'center'
    leading?: number
    after?: number
    x?: number
  },
) {
  if (lines.length === 0) return
  setStyle(w, opts)
  const lh = lineHeightMm(opts.size, opts.leading ?? 1.45)
  const ascent = pxToMm(opts.size)
  const x = opts.x ?? (opts.align === 'center' ? PAGE_WIDTH_MM / 2 : w.left)

  for (const line of lines) {
    ensureSpace(w, lh)
    w.doc.text(line, x, w.y + ascent * 0.85, {
      align: opts.align ?? 'left',
    })
    w.y += lh
  }
  w.y += opts.after ?? 0
}

function writeWrapped(
  w: PdfWriter,
  text: string,
  opts: Parameters<typeof writeLines>[2] & { maxWidth?: number },
) {
  const { maxWidth, ...lineOpts } = opts
  setStyle(w, lineOpts)
  writeLines(w, wrap(w, text, maxWidth ?? w.width), lineOpts)
}

function heading(w: PdfWriter, text: string) {
  w.y += SECTION_GAP_MM
  writeLines(w, [text.toUpperCase()], {
    size: w.sizes.sectionHeading,
    bold: true,
    color: [39, 39, 42],
    leading: 1.2,
  })
  w.y += pxToMm(3)
  drawRule(w)
  w.y += HEADING_AFTER_MM - pxToMm(6)
}

function contactParts(resume: ResumeData): string[] {
  const { contact } = resume
  return [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin ? displayLinkedIn(contact.linkedin) : '',
    contact.website ? displayWebsite(contact.website) : '',
  ].filter(Boolean)
}

/**
 * Packs whole contact items onto lines so an item like "San Francisco, CA"
 * never splits across lines. Assumes the text style is already set.
 */
function packParts(
  w: PdfWriter,
  parts: string[],
  maxWidth: number,
  sep = '  |  ',
): string[] {
  const lines: string[] = []
  let current = ''
  for (const part of parts) {
    const candidate = current ? `${current}${sep}${part}` : part
    if (w.doc.getTextWidth(candidate) <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    if (w.doc.getTextWidth(part) <= maxWidth) {
      current = part
    } else {
      const pieces = wrap(w, part, maxWidth)
      lines.push(...pieces.slice(0, -1))
      current = pieces[pieces.length - 1] ?? ''
    }
  }
  if (current) lines.push(current)
  return lines
}

/** Name and contact on the left, square photo on the right edge. */
function buildContactWithPhoto(
  w: PdfWriter,
  resume: ResumeData,
  photo: string,
) {
  const top = w.y
  const photoMm = pxToMm(PHOTO_DISPLAY_PX)
  const textWidth = w.width - photoMm - pxToMm(24)
  const name = (resume.contact.fullName || 'Your Name').toUpperCase()
  const parts = contactParts(resume)

  const nameOpts = {
    size: w.sizes.name,
    bold: true,
    color: [24, 24, 27] as [number, number, number],
    leading: 1.15,
  }
  const metaOpts = {
    size: w.sizes.contactMeta,
    color: [82, 82, 91] as [number, number, number],
    leading: 1.4,
  }

  setStyle(w, nameOpts)
  const nameLines = wrap(w, name, textWidth)
  setStyle(w, metaOpts)
  const metaLines = packParts(w, parts, textWidth)

  const textHeight =
    nameLines.length * lineHeightMm(nameOpts.size, nameOpts.leading) +
    (metaLines.length > 0
      ? pxToMm(4) + metaLines.length * lineHeightMm(metaOpts.size, metaOpts.leading)
      : 0)

  w.y = top + Math.max(0, (photoMm - textHeight) / 2)
  writeLines(w, nameLines, nameOpts)
  if (metaLines.length > 0) {
    w.y += pxToMm(4)
    writeLines(w, metaLines, metaOpts)
  }

  w.doc.addImage(photo, 'JPEG', w.right - photoMm, top, photoMm, photoMm)
  w.y = Math.max(w.y, top + photoMm)

  w.y += pxToMm(8)
  drawRule(w)
}

function buildContact(w: PdfWriter, resume: ResumeData) {
  const { contact } = resume
  if (contact.photo) {
    buildContactWithPhoto(w, resume, contact.photo)
    return
  }
  writeLines(w, [(contact.fullName || 'Your Name').toUpperCase()], {
    size: w.sizes.name,
    bold: true,
    color: [24, 24, 27],
    align: 'center',
    leading: 1.15,
  })

  const parts = contactParts(resume)

  if (parts.length > 0) {
    w.y += pxToMm(4)
    writeWrapped(w, parts.join('  |  '), {
      size: w.sizes.contactMeta,
      color: [82, 82, 91],
      align: 'center',
      leading: 1.4,
    })
  }

  w.y += pxToMm(8)
  drawRule(w)
}

function buildSummary(w: PdfWriter, resume: ResumeData) {
  if (!resume.summary.trim()) return
  heading(w, SECTION_LABELS.summary)
  writeWrapped(w, resume.summary, {
    size: w.sizes.body,
    color: [63, 63, 70],
    leading: 1.45,
  })
}

function buildExperience(w: PdfWriter, resume: ResumeData) {
  if (resume.experience.length === 0) return
  heading(w, SECTION_LABELS.experience)

  for (const entry of sortExperience(resume.experience)) {
    w.y += ENTRY_GAP_MM
    const dates = formatDateRange(entry.startDate, entry.endDate, entry.current)
    const role = entry.role || 'Role'

    setStyle(w, { size: w.sizes.dates, color: [113, 113, 122] })
    const dateWidth = dates ? w.doc.getTextWidth(dates) + 3 : 0
    setStyle(w, {
      size: w.sizes.roleTitle,
      bold: true,
      color: [24, 24, 27],
    })
    const roleLines = wrap(w, role, Math.max(40, w.width - dateWidth))

    writeLines(w, roleLines.slice(0, 1), {
      size: w.sizes.roleTitle,
      bold: true,
      color: [24, 24, 27],
      leading: 1.25,
    })
    if (dates) {
      const firstBaseline = w.y - lineHeightMm(w.sizes.roleTitle, 1.25) + pxToMm(w.sizes.roleTitle) * 0.85
      setStyle(w, { size: w.sizes.dates, color: [113, 113, 122] })
      w.doc.text(dates, w.right, firstBaseline, { align: 'right' })
    }
    if (roleLines.length > 1) {
      writeLines(w, roleLines.slice(1), {
        size: w.sizes.roleTitle,
        bold: true,
        color: [24, 24, 27],
        leading: 1.25,
      })
    }

    if (entry.company) {
      writeWrapped(w, entry.company, {
        size: w.sizes.body,
        color: [63, 63, 70],
        leading: 1.35,
      })
    }
    if (entry.location) {
      writeWrapped(w, entry.location, {
        size: w.sizes.dates,
        color: [113, 113, 122],
        leading: 1.35,
      })
    }

    for (const bullet of entry.bullets.map((b) => b.trim()).filter(Boolean)) {
      w.y += TIGHT_GAP_MM
      const indent = pxToMm(14)
      setStyle(w, { size: w.sizes.body, color: [63, 63, 70] })
      const marker = '• '
      const markerWidth = w.doc.getTextWidth(marker)
      const lines = wrap(w, bullet, w.width - indent - markerWidth)
      const lh = lineHeightMm(w.sizes.body, 1.4)
      const ascent = pxToMm(w.sizes.body)

      lines.forEach((line, i) => {
        ensureSpace(w, lh)
        const baseline = w.y + ascent * 0.85
        if (i === 0) w.doc.text(marker, w.left + indent, baseline)
        w.doc.text(line, w.left + indent + markerWidth, baseline)
        w.y += lh
      })
    }
  }
}

function buildEducation(w: PdfWriter, resume: ResumeData) {
  if (resume.education.length === 0) return
  heading(w, SECTION_LABELS.education)

  for (const entry of sortEducation(resume.education)) {
    w.y += ENTRY_GAP_MM
    writeWrapped(w, entry.degree || 'Degree', {
      size: w.sizes.roleTitle,
      bold: true,
      color: [24, 24, 27],
      leading: 1.3,
    })
    const years = formatYearRange(entry.startDate, entry.endDate)
    const meta = [entry.school, entry.location, years].filter(Boolean).join(' • ')
    if (meta) {
      writeWrapped(w, meta, {
        size: w.sizes.body,
        color: [63, 63, 70],
        leading: 1.4,
      })
    }
    if (entry.details.trim()) {
      writeWrapped(w, entry.details, {
        size: w.sizes.details,
        color: [82, 82, 91],
        leading: 1.4,
      })
    }
  }
}

function buildSkills(w: PdfWriter, resume: ResumeData) {
  const skills = resume.skills.map((s) => s.trim()).filter(Boolean)
  if (skills.length === 0) return
  heading(w, SECTION_LABELS.skills)
  for (const line of skills) {
    w.y += TIGHT_GAP_MM
    writeWrapped(w, line, {
      size: w.sizes.body,
      color: [63, 63, 70],
      leading: 1.45,
    })
  }
}

const BUILDERS: Record<
  Exclude<SectionId, 'contact'>,
  (w: PdfWriter, resume: ResumeData) => void
> = {
  summary: buildSummary,
  experience: buildExperience,
  education: buildEducation,
  skills: buildSkills,
}

export function buildResumePdf(
  resume: ResumeData,
  style: ResumeStyle = DEFAULT_RESUME_STYLE,
): jsPDF {
  const w = createWriter(style)
  buildContact(w, resume)
  for (const id of resume.sectionOrder) {
    if (id === 'contact') continue
    BUILDERS[id](w, resume)
  }
  return w.doc
}

export async function exportPdf(
  resume: ResumeData,
  fileName: string,
  style: ResumeStyle = DEFAULT_RESUME_STYLE,
): Promise<void> {
  const pdf = buildResumePdf(resume, style)
  pdf.save(`${slugify(fileName)}.pdf`)
}
