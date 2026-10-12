import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  DocumentDefaults,
  ExternalHyperlink,
  ImageRun,
  ImportedXmlComponent,
  TabStopType,
  type ParagraphChild,
} from 'docx'
import { saveAs } from 'file-saver'
import type { ResumeData, ResumeStyle, SectionId } from '../types/resume'
import { REFERENCES_ON_REQUEST_TEXT, SECTION_LABELS } from '../types/resume'
import {
  contactLinks,
  referenceContactItems,
  referenceRole,
  type ContactItemKey,
} from './contactLinks'
import { contactIconPng } from './contactIcons'
import { formatDateRange, formatMonthYear, formatYearRange } from './formatDate'
import { sortCertifications, sortEducation, sortExperience } from './sortEntries'
import { visibleSectionOrder } from './sectionOrder'
import { pageContentWidth, pxToTwip } from './pageSize'
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

type DocxCtx = {
  font: string
  sizes: DocxTypographyScale
  /** Right edge of the text area, for right-aligned dates after a tab */
  contentWidthTwip: number
  /** PNG bytes for each contact icon on the contact line */
  icons: Partial<Record<ContactItemKey, Uint8Array>>
}

/** Matches the preview's 11px contact icons. */
const CONTACT_ICON_PX = 11

/**
 * Apple Pages ignores all direct paragraph formatting (alignment, spacing,
 * borders, indents, tabs) unless the document declares a default paragraph
 * style, which docx doesn't emit on its own.
 */
function normalParagraphStyle(): ImportedXmlComponent {
  const style = new ImportedXmlComponent('w:style', {
    'w:type': 'paragraph',
    'w:default': '1',
    'w:styleId': 'Normal',
  })
  style.push(new ImportedXmlComponent('w:name', { 'w:val': 'Normal' }))
  style.push(new ImportedXmlComponent('w:qFormat'))
  return style
}

function rightTab(ctx: DocxCtx) {
  return [{ type: TabStopType.RIGHT, position: ctx.contentWidthTwip }]
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
    // Hanging indent so wrapped lines align with the text, not the bullet
    indent: { left: 540, hanging: 180 },
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

  const items = contactLinks(contact)
  if (items.length > 0) {
    const run = (text: string) =>
      new TextRun({ text, size: ctx.sizes.contactMeta, font: ctx.font })
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        // Links stay in the body text colour (no Hyperlink style) to match the preview
        children: items.flatMap((item, i) => {
          const icon = ctx.icons[item.key]
          const content: ParagraphChild[] = icon
            ? [
                new ImageRun({
                  type: 'png',
                  data: icon,
                  transformation: {
                    width: CONTACT_ICON_PX,
                    height: CONTACT_ICON_PX,
                  },
                }),
                run(' '),
                run(item.text),
              ]
            : [run(item.text)]
          const nodes = item.href
            ? [new ExternalHyperlink({ link: item.href, children: content })]
            : content
          return i === 0 ? nodes : [run('  |  '), ...nodes]
        }),
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

  for (const entry of sortExperience(resume.experience)) {
    const dates = formatDateRange(entry.startDate, entry.endDate, entry.current)
    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 0 },
        tabStops: rightTab(ctx),
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

  for (const entry of sortEducation(resume.education)) {
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

function buildCertifications(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  if (resume.certifications.length === 0) return []
  const paras: Paragraph[] = [heading(SECTION_LABELS.certifications, ctx)]

  for (const entry of sortCertifications(resume.certifications)) {
    const date = formatMonthYear(entry.date)
    paras.push(
      new Paragraph({
        spacing: { before: 60, after: 0 },
        tabStops: rightTab(ctx),
        children: [
          new TextRun({
            text: entry.name || 'Certification',
            bold: true,
            size: ctx.sizes.body,
            font: ctx.font,
          }),
          ...(date
            ? [
                new TextRun({
                  text: `\t${date}`,
                  size: ctx.sizes.dates,
                  font: ctx.font,
                  color: '666666',
                }),
              ]
            : []),
        ],
      }),
    )
    if (entry.issuer.trim()) paras.push(body(entry.issuer, ctx))
  }

  return paras
}

function buildReferences(resume: ResumeData, ctx: DocxCtx): Paragraph[] {
  if (resume.referencesOnRequest) {
    return [
      heading(SECTION_LABELS.references, ctx),
      body(REFERENCES_ON_REQUEST_TEXT, ctx),
    ]
  }
  if (resume.references.length === 0) return []
  const paras: Paragraph[] = [heading(SECTION_LABELS.references, ctx)]

  for (const entry of resume.references) {
    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 20 },
        keepNext: true,
        children: [
          new TextRun({
            text: entry.name || 'Reference',
            bold: true,
            size: ctx.sizes.roleTitle,
            font: ctx.font,
          }),
        ],
      }),
    )
    const role = referenceRole(entry)
    if (role) paras.push(body(role, ctx))
    if (entry.relationship.trim()) {
      paras.push(body(entry.relationship, ctx, { size: ctx.sizes.details }))
    }
    const contacts = referenceContactItems(entry)
    if (contacts.length > 0) {
      const run = (text: string) =>
        new TextRun({
          text,
          size: ctx.sizes.dates,
          font: ctx.font,
          color: '666666',
        })
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          children: contacts.flatMap((item, i) => {
            const node = item.href
              ? new ExternalHyperlink({
                  link: item.href,
                  children: [run(item.text)],
                })
              : run(item.text)
            return i === 0 ? [node] : [run('  |  '), node]
          }),
        }),
      )
    }
  }

  return paras
}

const BUILDERS: Record<
  Exclude<SectionId, 'contact'>,
  (resume: ResumeData, ctx: DocxCtx) => Paragraph[]
> = {
  summary: buildSummary,
  experience: buildExperience,
  education: buildEducation,
  skills: buildSkills,
  certifications: buildCertifications,
  references: buildReferences,
}

export async function exportDocx(
  resume: ResumeData,
  fileName: string,
  style: ResumeStyle = DEFAULT_RESUME_STYLE,
): Promise<void> {
  const keys = [...new Set(contactLinks(resume.contact).map((item) => item.key))]
  const pngs = await Promise.all(keys.map((key) => contactIconPng(key)))
  const ctx: DocxCtx = {
    font: getFontDocx(style.fontFamily),
    sizes: scaledDocxTypography(style.fontSize),
    contentWidthTwip: pxToTwip(
      pageContentWidth(style.margins.left, style.margins.right),
    ),
    icons: Object.fromEntries(keys.map((key, i) => [key, pngs[i]])),
  }
  const children: Paragraph[] = [...buildContact(resume, ctx)]

  for (const id of visibleSectionOrder(resume)) {
    children.push(...BUILDERS[id](resume, ctx))
  }

  const doc = new Document({
    styles: {
      importedStyles: [
        new DocumentDefaults({ run: { font: ctx.font, size: ctx.sizes.body } }),
        normalParagraphStyle(),
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: pxToTwip(style.margins.top),
              right: pxToTwip(style.margins.right),
              bottom: pxToTwip(style.margins.bottom),
              left: pxToTwip(style.margins.left),
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
