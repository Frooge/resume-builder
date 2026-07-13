import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'
import type { ResumeData, ResumeStyle, SectionId } from '../types/resume'
import { SECTION_LABELS } from '../types/resume'
import { formatDateRange, formatYearRange } from './formatDate'
import {
  DEFAULT_RESUME_STYLE,
  getFontDocx,
  scaledDocxTypography,
  type DocxTypographyScale,
} from './typography'

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

type DocxCtx = {
  font: string
  sizes: DocxTypographyScale
}

function heading(text: string, ctx: DocxCtx): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12,
        color: '333333',
        space: 4,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: ctx.sizes.sectionHeading,
        font: ctx.font,
      }),
    ],
  })
}

function body(
  text: string,
  ctx: DocxCtx,
  opts?: { bold?: boolean; size?: number; italics?: boolean },
): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italics,
        size: opts?.size ?? ctx.sizes.body,
        font: ctx.font,
      }),
    ],
  })
}

function bullet(text: string, ctx: DocxCtx): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `• ${text}`,
        size: ctx.sizes.body,
        font: ctx.font,
      }),
    ],
  })
}

function buildContact(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  const { contact } = resume
  const paras: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 12,
          color: '333333',
          space: 8,
        },
      },
      children: [
        new TextRun({
          text: (contact.fullName || 'Your Name').toUpperCase(),
          bold: true,
          size: ctx.sizes.name,
          font: ctx.font,
        }),
      ],
    }),
  ]

  const parts = [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin ? displayLinkedIn(contact.linkedin) : '',
    contact.website ? displayWebsite(contact.website) : '',
  ].filter(Boolean)

  if (parts.length > 0) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: parts.join('  |  '),
            size: ctx.sizes.contactMeta,
            font: ctx.font,
          }),
        ],
      }),
    )
  }

  return paras
}

function buildSummary(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  if (!resume.summary.trim()) return []
  return [heading(SECTION_LABELS.summary, ctx), body(resume.summary, ctx)]
}

function buildExperience(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  if (resume.experience.length === 0) return []
  const paras: Paragraph[] = [heading(SECTION_LABELS.experience, ctx)]

  for (const entry of resume.experience) {
    const dates = formatDateRange(entry.startDate, entry.endDate, entry.current)
    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 0 },
        children: [
          new TextRun({
            text: entry.role || 'Role',
            bold: true,
            size: ctx.sizes.roleTitle,
            font: ctx.font,
          }),
          ...(dates
            ? [
                new TextRun({
                  text: `\t${dates}`,
                  size: ctx.sizes.dates,
                  font: ctx.font,
                  color: '666666',
                }),
              ]
            : []),
        ],
      }),
    )
    if (entry.company) {
      paras.push(body(entry.company, ctx))
    }
    if (entry.location) {
      paras.push(body(entry.location, ctx, { size: ctx.sizes.dates }))
    }
    for (const b of entry.bullets.map((x) => x.trim()).filter(Boolean)) {
      paras.push(bullet(b, ctx))
    }
  }

  return paras
}

function buildEducation(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  if (resume.education.length === 0) return []
  const paras: Paragraph[] = [heading(SECTION_LABELS.education, ctx)]

  for (const entry of resume.education) {
    const years = formatYearRange(entry.startDate, entry.endDate)
    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 20 },
        children: [
          new TextRun({
            text: entry.degree || 'Degree',
            bold: true,
            size: ctx.sizes.roleTitle,
            font: ctx.font,
          }),
        ],
      }),
    )
    const meta = [entry.school, entry.location, years].filter(Boolean).join(' • ')
    if (meta) paras.push(body(meta, ctx))
    if (entry.details.trim()) {
      paras.push(body(entry.details, ctx, { size: ctx.sizes.details }))
    }
  }

  return paras
}

function buildSkills(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  const skills = resume.skills.map((s) => s.trim()).filter(Boolean)
  if (skills.length === 0) return []
  return [
    heading(SECTION_LABELS.skills, ctx),
    ...skills.map((line) => body(line, ctx)),
  ]
}

const BUILDERS: Record<
  Exclude<SectionId, 'contact'>,
  (resume: ResumeData, ctx: DocxCtx) => Paragraph[]
> = {
  summary: buildSummary,
  experience: buildExperience,
  education: buildEducation,
  skills: buildSkills,
}

export async function exportDocx(
  resume: ResumeData,
  fileName: string,
  style: ResumeStyle = DEFAULT_RESUME_STYLE,
): Promise<void> {
  const ctx: DocxCtx = {
    font: getFontDocx(style.fontFamily),
    sizes: scaledDocxTypography(style.fontSize),
  }
  const children: Paragraph[] = [...buildContact(resume, ctx)]

  for (const id of resume.sectionOrder) {
    if (id === 'contact') continue
    children.push(...BUILDERS[id](resume, ctx))
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${slugify(fileName)}.docx`)
}
