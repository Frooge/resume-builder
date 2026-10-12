import { jsPDF } from 'jspdf'
import type { ResumeData, ResumeStyle, SectionId } from '../types/resume'
import { REFERENCES_ON_REQUEST_TEXT, SECTION_LABELS } from '../types/resume'
import {
  contactLinks,
  referenceContactItems,
  referenceRole,
  type ContactItem,
  type ContactItemKey,
  type ReferenceContactItem,
} from './contactLinks'
import {
  CONTACT_ICON_PATHS,
  CONTACT_ICON_RGB,
  CONTACT_ICON_VIEWBOX,
  iconPathOps,
} from './contactIcons'
import { formatDateRange, formatMonthYear, formatYearRange } from './formatDate'
import { toWinAnsi } from './pdfText'
import { sortCertifications, sortEducation, sortExperience } from './sortEntries'
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
const ITEM_GAP_MM = pxToMm(6)
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

const TITLE_COLOR: [number, number, number] = [24, 24, 27]
const DATE_COLOR: [number, number, number] = [113, 113, 122]

/** A bold title with an optional date right-aligned on its first line. */
function writeTitleWithDate(
  w: PdfWriter,
  title: string,
  date: string,
  opts: { size: number; leading: number },
) {
  setStyle(w, { size: w.sizes.dates, color: DATE_COLOR })
  const dateWidth = date ? w.doc.getTextWidth(toWinAnsi(date)) + 3 : 0
  const titleOpts = { ...opts, bold: true, color: TITLE_COLOR }
  setStyle(w, titleOpts)
  const lines = wrap(w, title, Math.max(40, w.width - dateWidth))

  writeLines(w, lines.slice(0, 1), titleOpts)
  if (date) {
    const firstBaseline =
      w.y - lineHeightMm(opts.size, opts.leading) + pxToMm(opts.size) * 0.85
    setStyle(w, { size: w.sizes.dates, color: DATE_COLOR })
    w.doc.text(toWinAnsi(date), w.right, firstBaseline, { align: 'right' })
  }
  if (lines.length > 1) writeLines(w, lines.slice(1), titleOpts)
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

type ContactSegment = {
  text: string
  href?: string
  icon?: ContactItemKey
  /** Icon, gap and text together */
  width: number
}

/** Matches the preview's 11px icon and `gap-1` before the text. */
const CONTACT_ICON_MM = pxToMm(11)
const CONTACT_ICON_GAP_MM = pxToMm(4)

/** Fills a contact icon as vector paths with its top-left corner at (x, y). */
function drawContactIcon(w: PdfWriter, key: ContactItemKey, x: number, y: number) {
  const scale = CONTACT_ICON_MM / CONTACT_ICON_VIEWBOX
  const px = (v: number) => x + v * scale
  const py = (v: number) => y + v * scale
  const { doc } = w
  for (const op of iconPathOps(CONTACT_ICON_PATHS[key])) {
    if (op.op === 'M') doc.moveTo(px(op.x), py(op.y))
    else if (op.op === 'L') doc.lineTo(px(op.x), py(op.y))
    else if (op.op === 'C') {
      doc.curveTo(px(op.x1), py(op.y1), px(op.x2), py(op.y2), px(op.x), py(op.y))
    } else doc.close()
  }
  doc.setFillColor(...CONTACT_ICON_RGB)
  doc.fill()
}

/**
 * Lays the contact line out segment by segment (not as one joined string) so
 * each link gets its own clickable area and its icon. Wraps between items,
 * centred like writeLines; an item wider than the line wraps on its own, with
 * the icon on its first piece.
 */
function writeContactLine(w: PdfWriter, items: ContactItem[]) {
  const size = w.sizes.contactMeta
  setStyle(w, { size, color: [82, 82, 91] })
  const sep = '  |  '
  const sepWidth = w.doc.getTextWidth(sep)
  const iconWidth = CONTACT_ICON_MM + CONTACT_ICON_GAP_MM
  const measure = (
    text: string,
    href?: string,
    icon?: ContactItemKey,
  ): ContactSegment => ({
    text,
    href,
    icon,
    width: w.doc.getTextWidth(text) + (icon ? iconWidth : 0),
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
    const seg = measure(toWinAnsi(item.text), item.href, item.key)
    if (seg.width > w.width) {
      flush()
      wrap(w, seg.text, w.width - iconWidth).forEach((piece, i) => {
        lines.push([measure(piece, seg.href, i === 0 ? seg.icon : undefined)])
      })
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
    // Centre icons on the lowercase body of the text, as the preview's items-center does
    const iconTop = baseline - ascent * 0.35 - CONTACT_ICON_MM / 2
    let x = PAGE_WIDTH_MM / 2 - lineWidth / 2
    line.forEach((seg, i) => {
      if (i > 0) {
        w.doc.text(sep, x, baseline)
        x += sepWidth
      }
      if (seg.href) w.doc.link(x, w.y, seg.width, lh, { url: seg.href })
      let textX = x
      if (seg.icon) {
        drawContactIcon(w, seg.icon, x, iconTop)
        textX += iconWidth
      }
      w.doc.text(seg.text, textX, baseline)
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
    writeTitleWithDate(w, entry.role || 'Role', dates, {
      size: w.sizes.roleTitle,
      leading: 1.25,
    })

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
  if (resume.certifications.length === 0) return
  heading(w, SECTION_LABELS.certifications)
  for (const entry of sortCertifications(resume.certifications)) {
    w.y += ITEM_GAP_MM
    writeTitleWithDate(w, entry.name || 'Certification', formatMonthYear(entry.date), {
      size: w.sizes.body,
      leading: 1.3,
    })
    if (entry.issuer.trim()) {
      writeWrapped(w, entry.issuer, {
        size: w.sizes.body,
        color: [63, 63, 70],
        leading: 1.35,
      })
    }
  }
}

/** "phone  |  email" on one line when it fits, else one item per line; the email is a link. */
function writeReferenceContacts(w: PdfWriter, items: ReferenceContactItem[]) {
  if (items.length === 0) return
  const size = w.sizes.dates
  setStyle(w, { size, color: DATE_COLOR })
  const sep = '  |  '
  const sepWidth = w.doc.getTextWidth(sep)
  const segs = items.map((item) => {
    const text = toWinAnsi(item.text)
    return { text, href: item.href, width: w.doc.getTextWidth(text) }
  })
  const total =
    segs.reduce((sum, seg) => sum + seg.width, 0) + sepWidth * (segs.length - 1)
  const lines = total <= w.width ? [segs] : segs.map((seg) => [seg])

  const lh = lineHeightMm(size, 1.4)
  const ascent = pxToMm(size)
  for (const line of lines) {
    ensureSpace(w, lh)
    const baseline = w.y + ascent * 0.85
    let x = w.left
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

function buildReferences(w: PdfWriter, resume: ResumeData) {
  if (resume.referencesOnRequest) {
    heading(w, SECTION_LABELS.references)
    w.y += ITEM_GAP_MM
    writeWrapped(w, REFERENCES_ON_REQUEST_TEXT, {
      size: w.sizes.body,
      color: [63, 63, 70],
      leading: 1.45,
    })
    return
  }
  if (resume.references.length === 0) return
  heading(w, SECTION_LABELS.references)

  for (const entry of resume.references) {
    w.y += ENTRY_GAP_MM
    const role = referenceRole(entry)
    const relationship = entry.relationship.trim()
    const contacts = referenceContactItems(entry)
    // Keep each reference on one page, as the preview does
    ensureSpace(
      w,
      lineHeightMm(w.sizes.roleTitle, 1.3) +
        (role ? lineHeightMm(w.sizes.body, 1.4) : 0) +
        (relationship ? lineHeightMm(w.sizes.details, 1.4) : 0) +
        (contacts.length > 0 ? lineHeightMm(w.sizes.dates, 1.4) : 0),
    )

    writeWrapped(w, entry.name || 'Reference', {
      size: w.sizes.roleTitle,
      bold: true,
      color: TITLE_COLOR,
      leading: 1.3,
    })
    if (role) {
      writeWrapped(w, role, {
        size: w.sizes.body,
        color: [63, 63, 70],
        leading: 1.4,
      })
    }
    if (relationship) {
      writeWrapped(w, relationship, {
        size: w.sizes.details,
        color: [82, 82, 91],
        leading: 1.4,
      })
    }
    writeReferenceContacts(w, contacts)
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
  references: buildReferences,
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
