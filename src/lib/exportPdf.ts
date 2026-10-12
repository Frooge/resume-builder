import { jsPDF } from 'jspdf'
import type { ResumeData, ResumeStyle, SectionId } from '../types/resume'
import { SECTION_LABELS } from '../types/resume'
import { contactLinks, type ContactItem } from './contactLinks'
import { formatDateRange, formatYearRange } from './formatDate'
import { toWinAnsi } from './pdfText'
import { sortEducation, sortExperience } from './sortEntries'
import { visibleSectionOrder } from './sectionOrder'
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
  return w.doc.splitTextToSize(toWinAnsi(text), maxWidth)
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
  },
) {
  if (lines.length === 0) return
  setStyle(w, opts)
  const lh = lineHeightMm(opts.size, opts.leading ?? 1.45)
  const ascent = pxToMm(opts.size)
  const x = opts.align === 'center' ? PAGE_WIDTH_MM / 2 : w.left

  for (const line of lines) {
    ensureSpace(w, lh)
    w.doc.text(toWinAnsi(line), x, w.y + ascent * 0.85, {
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

function writeBullet(w: PdfWriter, text: string) {
  const indent = pxToMm(14)
  setStyle(w, { size: w.sizes.body, color: [63, 63, 70] })
  const marker = '• '
  const markerWidth = w.doc.getTextWidth(marker)
  const lines = wrap(w, text, w.width - indent - markerWidth)
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

function buildContact(w: PdfWriter, resume: ResumeData) {
  const { contact } = resume
  writeLines(w, [(contact.fullName || 'Your Name').toUpperCase()], {
    size: w.sizes.name,
    bold: true,
    color: [24, 24, 27],
    align: 'center',
    leading: 1.15,
  })

  const items = contactLinks(contact)
  if (items.length > 0) {
    w.y += pxToMm(4)
    writeContactLine(w, items)
  }

  w.y += pxToMm(8)
  drawRule(w)
}

type ContactSegment = { text: string; href?: string; width: number }

/**
 * Lays the contact line out segment by segment (not as one joined string) so
 * each link gets its own clickable area. Wraps between items, centred like
 * writeLines; an item wider than the line wraps on its own.
 */
function writeContactLine(w: PdfWriter, items: ContactItem[]) {
  const size = w.sizes.contactMeta
  setStyle(w, { size, color: [82, 82, 91] })
  const sep = '  |  '
  const sepWidth = w.doc.getTextWidth(sep)
  const measure = (text: string, href?: string): ContactSegment => ({
    text,
    href,
    width: w.doc.getTextWidth(text),
  })

  const lines: ContactSegment[][] = []
  let current: ContactSegment[] = []
  let currentWidth = 0
  const flush = () => {
    if (current.length > 0) lines.push(current)
    current = []
    currentWidth = 0
  }

  for (const item of items) {
    const seg = measure(toWinAnsi(item.text), item.href)
    if (seg.width > w.width) {
      flush()
      for (const piece of wrap(w, seg.text)) lines.push([measure(piece, seg.href)])
      continue
    }
    const added = (current.length > 0 ? sepWidth : 0) + seg.width
    if (current.length > 0 && currentWidth + added > w.width) {
      flush()
      current.push(seg)
      currentWidth = seg.width
    } else {
      current.push(seg)
      currentWidth += added
    }
  }
  flush()

  const lh = lineHeightMm(size, 1.4)
  const ascent = pxToMm(size)
  for (const line of lines) {
    ensureSpace(w, lh)
    const lineWidth =
      line.reduce((sum, seg) => sum + seg.width, 0) + sepWidth * (line.length - 1)
    const baseline = w.y + ascent * 0.85
    let x = PAGE_WIDTH_MM / 2 - lineWidth / 2
    line.forEach((seg, i) => {
      if (i > 0) {
        w.doc.text(sep, x, baseline)
        x += sepWidth
      }
      w.doc.text(seg.text, x, baseline)
      if (seg.href) w.doc.link(x, w.y, seg.width, lh, { url: seg.href })
      x += seg.width
    })
    w.y += lh
  }
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
      writeBullet(w, bullet)
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

function buildCertifications(w: PdfWriter, resume: ResumeData) {
  const lines = resume.certifications.map((s) => s.trim()).filter(Boolean)
  if (lines.length === 0) return
  heading(w, SECTION_LABELS.certifications)
  for (const line of lines) {
    w.y += TIGHT_GAP_MM
    writeBullet(w, line)
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
  certifications: buildCertifications,
}

export function buildResumePdf(
  resume: ResumeData,
  style: ResumeStyle = DEFAULT_RESUME_STYLE,
): jsPDF {
  const w = createWriter(style)
  buildContact(w, resume)
  for (const id of visibleSectionOrder(resume)) {
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
