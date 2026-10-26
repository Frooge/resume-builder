import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ReferenceEntry,
  ResumeData,
  ResumeStyle,
  SectionId,
} from '../../types/resume'
import { REFERENCES_ON_REQUEST_TEXT, SECTION_LABELS } from '../../types/resume'
import {
  formatDateRange,
  formatMonthYear,
  formatYearRange,
} from '../../lib/formatDate'
import {
  contactLinks,
  referenceContactItems,
  referenceRole,
  type ContactItemKey,
} from '../../lib/contactLinks'
import { CONTACT_ICON_PATHS, CONTACT_ICON_VIEWBOX } from '../../lib/contactIcons'
import {
  sortCertifications,
  sortEducation,
  sortExperience,
} from '../../lib/sortEntries'
import { isPinnedSection, visibleSectionOrder } from '../../lib/sectionOrder'
import {
  PAGE_GAP_PX,
  PAGE_HEIGHT_PX,
  PAGE_PACK_BUFFER_PX,
  PAGE_WIDTH_PX,
  pageContentHeight,
  pageContentWidth,
} from '../../lib/pageSize'
import {
  typographyCssVars,
  normalizeResumeStyle,
  scaledTypography,
} from '../../lib/typography'
import {
  fitParams,
  getSpacing,
  NO_FIT,
  searchFit,
  type DensitySpacing,
} from '../../lib/density'
import { PHOTO_DISPLAY_PX } from '../../lib/photo'
import { SectionChrome } from './SectionChrome'

interface ResumeDocumentProps {
  resume: ResumeData
  style: ResumeStyle
  onEditSection: (id: SectionId) => void
}

/** Compact mode keeps a little air between a section rule and its content. */
const COMPACT_MIN_GAP_AFTER_HEADING_PX = 3

type FlowUnit =
  | { key: string; sectionId: SectionId; kind: 'contact' }
  | { key: string; sectionId: SectionId; kind: 'summary' }
  | { key: string; sectionId: 'skills'; kind: 'skills-heading' }
  | { key: string; sectionId: 'skills'; kind: 'skills-line'; line: string }
  | { key: string; sectionId: 'skills'; kind: 'skills-empty' }
  | {
      key: string
      sectionId: 'certifications'
      kind: 'certifications-heading'
      continued: boolean
    }
  | {
      key: string
      sectionId: 'certifications'
      kind: 'certifications-entry'
      entry: CertificationEntry
    }
  | {
      key: string
      sectionId: 'certifications'
      kind: 'certifications-empty'
    }
  | {
      key: string
      sectionId: 'references'
      kind: 'references-heading'
      continued: boolean
    }
  | {
      key: string
      sectionId: 'references'
      kind: 'references-entry'
      entry: ReferenceEntry
    }
  | { key: string; sectionId: 'references'; kind: 'references-on-request' }
  | { key: string; sectionId: 'references'; kind: 'references-empty' }
  | {
      key: string
      sectionId: 'experience'
      kind: 'experience-heading'
      continued: boolean
    }
  | {
      key: string
      sectionId: 'experience'
      kind: 'experience-header'
      entry: ExperienceEntry
    }
  | {
      key: string
      sectionId: 'experience'
      kind: 'experience-bullet'
      entryId: string
      bullet: string
    }
  | { key: string; sectionId: 'experience'; kind: 'experience-empty' }
  | {
      key: string
      sectionId: 'education'
      kind: 'education-heading'
      continued: boolean
    }
  | {
      key: string
      sectionId: 'education'
      kind: 'education-entry'
      entry: EducationEntry
    }
  | { key: string; sectionId: 'education'; kind: 'education-empty' }

function ContactIcon({ itemKey }: { itemKey: ContactItemKey }) {
  const box = CONTACT_ICON_VIEWBOX
  return (
    <svg width="11" height="11" viewBox={`0 0 ${box} ${box}`} fill="currentColor" aria-hidden>
      <path d={CONTACT_ICON_PATHS[itemKey]} />
    </svg>
  )
}

function ContactItem({
  itemKey,
  text,
  href,
}: {
  itemKey: ContactItemKey
  text: string
  href?: string
}) {
  const body = (
    <>
      <span className="text-zinc-600">
        <ContactIcon itemKey={itemKey} />
      </span>
      <span>{text}</span>
    </>
  )
  const className = 'inline-flex items-center gap-1 whitespace-nowrap'

  // Links keep the contact line's look: inherited colour, no underline
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} text-inherit no-underline`}
    >
      {body}
    </a>
  ) : (
    <span className={className}>{body}</span>
  )
}

/** Compact contact line: plain text separated by pipes, links kept. */
function CompactContactLine({
  items,
  hasPhoto,
}: {
  items: ReturnType<typeof contactLinks>
  hasPhoto: boolean
}) {
  return (
    <p
      className={`mt-0.5 font-normal leading-snug text-zinc-600 ${hasPhoto ? 'text-left' : 'text-center'}`}
      style={{ fontSize: 'var(--fs-contact-meta)' }}
    >
      {items.map((item, i) => (
        <span key={item.key}>
          {i > 0 ? ' \u00a0|\u00a0 ' : null}
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-inherit no-underline"
            >
              {item.text}
            </a>
          ) : (
            item.text
          )}
        </span>
      ))}
    </p>
  )
}

function ContactBlock({
  resume,
  compact,
}: {
  resume: ResumeData
  compact: boolean
}) {
  const { contact } = resume
  const items = contactLinks(contact)

  const hasPhoto = Boolean(contact.photo)
  const text = (
    <>
      <h1
        className="font-bold uppercase leading-tight tracking-[0.04em] text-zinc-900"
        style={{ fontSize: 'var(--fs-name)' }}
      >
        {contact.fullName || 'Your Name'}
      </h1>
      {items.length > 0 && compact ? (
        <CompactContactLine items={items} hasPhoto={hasPhoto} />
      ) : items.length > 0 ? (
        <p
          className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-normal leading-relaxed text-zinc-600 ${hasPhoto ? 'justify-start' : 'justify-center'}`}
          style={{ fontSize: 'var(--fs-contact-meta)' }}
        >
          {items.map((item) => (
            <ContactItem
              key={item.key}
              itemKey={item.key}
              text={item.text}
              href={item.href}
            />
          ))}
        </p>
      ) : (
        <p
          className="mt-2 text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          Add contact details in the editor
        </p>
      )}
    </>
  )

  if (!hasPhoto) {
    return (
      <header
        className={`border-b border-zinc-800 text-center ${compact ? 'pb-1.5' : 'pb-3'}`}
      >
        {text}
      </header>
    )
  }

  // Fixed photo size keeps the off-screen height measurement stable
  // before the image decodes.
  return (
    <header
      className={`flex items-center gap-6 border-b border-zinc-800 ${compact ? 'pb-1.5' : 'pb-3'}`}
    >
      <div className="min-w-0 flex-1 text-left">{text}</div>
      <img
        src={contact.photo}
        alt=""
        width={PHOTO_DISPLAY_PX}
        height={PHOTO_DISPLAY_PX}
        className="shrink-0 object-cover"
        style={{ width: PHOTO_DISPLAY_PX, height: PHOTO_DISPLAY_PX }}
      />
    </header>
  )
}

function SectionHeading({
  children,
  continued,
}: {
  children: string
  continued?: boolean
}) {
  return (
    <h2
      className="border-b border-zinc-800 pb-[3px] font-bold uppercase tracking-[0.06em] text-zinc-800"
      style={{ fontSize: 'var(--fs-section-heading)' }}
    >
      {children}
      {continued ? ' (cont.)' : ''}
    </h2>
  )
}

function SummaryBlock({ resume }: { resume: ResumeData }) {
  return (
    <section
      className="flex flex-col"
      style={{ gap: 'var(--gap-heading-after)' }}
    >
      <SectionHeading>{SECTION_LABELS.summary}</SectionHeading>
      {resume.summary.trim() ? (
        <p
          className="font-normal text-zinc-700 text-justify"
          style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }}
        >
          {resume.summary}
        </p>
      ) : (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No summary yet.
        </p>
      )}
    </section>
  )
}

/** Splits "Languages: TypeScript, Go" into label and rest; null if no label. */
function splitSkillLabel(line: string): [string, string] | null {
  const m = /^([^:]{1,40}):\s*(.+)$/.exec(line)
  return m ? [m[1], m[2]] : null
}

function SkillsLine({ line, compact }: { line: string; compact: boolean }) {
  const labelled = compact ? splitSkillLabel(line) : null
  return (
    <p
      className="font-normal text-zinc-700"
      style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }}
    >
      {labelled ? (
        <>
          <span className="font-semibold text-zinc-900">{labelled[0]}:</span>{' '}
          {labelled[1]}
        </>
      ) : (
        line
      )}
    </p>
  )
}

function SplitRow({
  left,
  right,
  className,
  style,
  rightStyle,
}: {
  left: ReactNode
  right?: string
  className: string
  style: CSSProperties
  rightStyle: CSSProperties
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className={`min-w-0 ${className}`} style={style}>
        {left}
      </p>
      {right ? (
        <p
          className="shrink-0 font-normal text-zinc-500"
          style={rightStyle}
        >
          {right}
        </p>
      ) : null}
    </div>
  )
}

function CompactExperienceHeaderBlock({ entry }: { entry: ExperienceEntry }) {
  const dates = formatDateRange(entry.startDate, entry.endDate, entry.current)
  const datesStyle = { fontSize: 'var(--fs-dates)' }

  return (
    <div style={{ lineHeight: 'var(--lh-body)' }}>
      <SplitRow
        left={entry.role || 'Role'}
        right={dates}
        className="font-semibold text-zinc-900"
        style={{ fontSize: 'var(--fs-role-title)' }}
        rightStyle={datesStyle}
      />
      {entry.company || entry.location ? (
        <SplitRow
          left={entry.company}
          right={entry.location}
          className="font-normal italic text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
          rightStyle={datesStyle}
        />
      ) : null}
    </div>
  )
}

function ExperienceHeaderBlock({
  entry,
  compact,
}: {
  entry: ExperienceEntry
  compact: boolean
}) {
  if (compact) return <CompactExperienceHeaderBlock entry={entry} />
  const dates = formatDateRange(entry.startDate, entry.endDate, entry.current)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="font-semibold text-zinc-900"
          style={{ fontSize: 'var(--fs-role-title)' }}
        >
          {entry.role || 'Role'}
        </p>
        {dates ? (
          <p
            className="shrink-0 font-normal text-zinc-500"
            style={{ fontSize: 'var(--fs-dates)' }}
          >
            {dates}
          </p>
        ) : null}
      </div>
      {entry.company ? (
        <p
          className="font-normal text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {entry.company}
        </p>
      ) : null}
      {entry.location ? (
        <p
          className="font-normal text-zinc-500"
          style={{ fontSize: 'var(--fs-dates)' }}
        >
          {entry.location}
        </p>
      ) : null}
    </div>
  )
}

function ExperienceBullet({
  bullet,
  spacing,
}: {
  bullet: string
  spacing: DensitySpacing
}) {
  return (
    <ul className="list-disc" style={{ paddingLeft: spacing.bulletIndent }}>
      <li
        className="font-normal text-zinc-700"
        style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-bullet)' }}
      >
        {bullet}
      </li>
    </ul>
  )
}

function CompactEducationEntryBlock({ entry }: { entry: EducationEntry }) {
  const years = formatYearRange(entry.startDate, entry.endDate)
  const place = [entry.school, entry.location].filter(Boolean).join(', ')

  return (
    <div style={{ lineHeight: 'var(--lh-body)' }}>
      <SplitRow
        left={
          <>
            <span
              className="font-semibold text-zinc-900"
              style={{ fontSize: 'var(--fs-role-title)' }}
            >
              {entry.degree || 'Degree'}
            </span>
            {place ? <span> · {place}</span> : null}
          </>
        }
        right={years}
        className="font-normal text-zinc-700"
        style={{ fontSize: 'var(--fs-body)' }}
        rightStyle={{ fontSize: 'var(--fs-dates)' }}
      />
      {entry.details.trim() ? (
        <p
          className="font-normal text-zinc-600"
          style={{ fontSize: 'var(--fs-details)' }}
        >
          {entry.details}
        </p>
      ) : null}
    </div>
  )
}

function EducationEntryBlock({
  entry,
  compact,
}: {
  entry: EducationEntry
  compact: boolean
}) {
  if (compact) return <CompactEducationEntryBlock entry={entry} />
  const years = formatYearRange(entry.startDate, entry.endDate)
  const meta = [entry.school, entry.location, years].filter(Boolean).join(' • ')

  return (
    <div>
      <p
        className="font-semibold text-zinc-900"
        style={{ fontSize: 'var(--fs-role-title)' }}
      >
        {entry.degree || 'Degree'}
      </p>
      {meta ? (
        <p
          className="font-normal leading-[1.4] text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {meta}
        </p>
      ) : null}
      {entry.details.trim() ? (
        <p
          className="mt-0.5 font-normal text-zinc-600"
          style={{ fontSize: 'var(--fs-details)' }}
        >
          {entry.details}
        </p>
      ) : null}
    </div>
  )
}

function CertificationEntryBlock({
  entry,
  compact,
}: {
  entry: CertificationEntry
  compact: boolean
}) {
  const date = formatMonthYear(entry.date)

  if (compact) {
    const issuer = entry.issuer.trim()
    return (
      <div style={{ lineHeight: 'var(--lh-body)' }}>
        <SplitRow
          left={
            <>
              <span className="font-semibold text-zinc-900">
                {entry.name || 'Certification'}
              </span>
              {issuer ? <span> · {issuer}</span> : null}
            </>
          }
          right={date}
          className="font-normal text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
          rightStyle={{ fontSize: 'var(--fs-dates)' }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="font-semibold text-zinc-900"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {entry.name || 'Certification'}
        </p>
        {date ? (
          <p
            className="shrink-0 font-normal text-zinc-500"
            style={{ fontSize: 'var(--fs-dates)' }}
          >
            {date}
          </p>
        ) : null}
      </div>
      {entry.issuer.trim() ? (
        <p
          className="font-normal text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {entry.issuer}
        </p>
      ) : null}
    </div>
  )
}

function ReferenceEntryBlock({
  entry,
  compact,
}: {
  entry: ReferenceEntry
  compact: boolean
}) {
  const role = referenceRole(entry)
  const contacts = referenceContactItems(entry)

  return (
    <div style={compact ? { lineHeight: 'var(--lh-body)' } : undefined}>
      <p
        className="font-semibold text-zinc-900"
        style={{ fontSize: 'var(--fs-role-title)' }}
      >
        {entry.name || 'Reference'}
        {compact && role ? (
          <span
            className="font-normal text-zinc-700"
            style={{ fontSize: 'var(--fs-body)' }}
          >
            {' '}
            · {role}
          </span>
        ) : null}
      </p>
      {role && !compact ? (
        <p
          className="font-normal leading-[1.4] text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {role}
        </p>
      ) : null}
      {entry.relationship.trim() ? (
        <p
          className="font-normal text-zinc-600"
          style={{ fontSize: 'var(--fs-details)' }}
        >
          {entry.relationship}
        </p>
      ) : null}
      {contacts.length > 0 ? (
        <p
          className="font-normal text-zinc-500"
          style={{ fontSize: 'var(--fs-dates)' }}
        >
          {contacts.map((item, i) => (
            <span key={item.text}>
              {i > 0 ? <span className="whitespace-pre">{'  |  '}</span> : null}
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit no-underline"
                >
                  {item.text}
                </a>
              ) : (
                item.text
              )}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}

function buildFlowUnits(resume: ResumeData): FlowUnit[] {
  const body = visibleSectionOrder(resume)
  const units: FlowUnit[] = [
    { key: 'contact', sectionId: 'contact', kind: 'contact' },
  ]

  for (const id of body) {
    if (id === 'summary') {
      units.push({ key: 'summary', sectionId: 'summary', kind: 'summary' })
      continue
    }
    if (id === 'skills') {
      units.push({
        key: 'skills-heading',
        sectionId: 'skills',
        kind: 'skills-heading',
      })
      const lines = resume.skills.map((s) => s.trim()).filter(Boolean)
      if (lines.length === 0) {
        units.push({
          key: 'skills-empty',
          sectionId: 'skills',
          kind: 'skills-empty',
        })
      } else {
        lines.forEach((line, i) => {
          units.push({
            key: `skills-line-${i}`,
            sectionId: 'skills',
            kind: 'skills-line',
            line,
          })
        })
      }
      continue
    }
    if (id === 'certifications') {
      units.push({
        key: 'certifications-heading',
        sectionId: 'certifications',
        kind: 'certifications-heading',
        continued: false,
      })
      if (resume.certifications.length === 0) {
        units.push({
          key: 'certifications-empty',
          sectionId: 'certifications',
          kind: 'certifications-empty',
        })
      } else {
        for (const entry of sortCertifications(resume.certifications)) {
          units.push({
            key: `certifications-${entry.id}`,
            sectionId: 'certifications',
            kind: 'certifications-entry',
            entry,
          })
        }
      }
      continue
    }
    if (id === 'references') {
      units.push({
        key: 'references-heading',
        sectionId: 'references',
        kind: 'references-heading',
        continued: false,
      })
      if (resume.referencesOnRequest) {
        units.push({
          key: 'references-on-request',
          sectionId: 'references',
          kind: 'references-on-request',
        })
      } else if (resume.references.length === 0) {
        units.push({
          key: 'references-empty',
          sectionId: 'references',
          kind: 'references-empty',
        })
      } else {
        for (const entry of resume.references) {
          units.push({
            key: `references-${entry.id}`,
            sectionId: 'references',
            kind: 'references-entry',
            entry,
          })
        }
      }
      continue
    }
    if (id === 'experience') {
      units.push({
        key: 'experience-heading',
        sectionId: 'experience',
        kind: 'experience-heading',
        continued: false,
      })
      if (resume.experience.length === 0) {
        units.push({
          key: 'experience-empty',
          sectionId: 'experience',
          kind: 'experience-empty',
        })
      } else {
        for (const entry of sortExperience(resume.experience)) {
          units.push({
            key: `experience-header-${entry.id}`,
            sectionId: 'experience',
            kind: 'experience-header',
            entry,
          })
          entry.bullets
            .map((b) => b.trim())
            .filter(Boolean)
            .forEach((bullet, i) => {
              units.push({
                key: `experience-bullet-${entry.id}-${i}`,
                sectionId: 'experience',
                kind: 'experience-bullet',
                entryId: entry.id,
                bullet,
              })
            })
        }
      }
      continue
    }
    if (id === 'education') {
      units.push({
        key: 'education-heading',
        sectionId: 'education',
        kind: 'education-heading',
        continued: false,
      })
      if (resume.education.length === 0) {
        units.push({
          key: 'education-empty',
          sectionId: 'education',
          kind: 'education-empty',
        })
      } else {
        for (const entry of sortEducation(resume.education)) {
          units.push({
            key: `education-${entry.id}`,
            sectionId: 'education',
            kind: 'education-entry',
            entry,
          })
        }
      }
    }
  }

  return units
}

function baseGap(unit: FlowUnit, spacing: DensitySpacing): number {
  if (unit.kind === 'experience-bullet') return spacing.bulletGap
  if (unit.kind === 'skills-line') return spacing.skillGap
  if (
    unit.kind === 'certifications-entry' ||
    unit.kind === 'references-on-request'
  ) {
    return spacing.itemGap
  }

  if (
    unit.kind === 'experience-header' ||
    unit.kind === 'experience-empty' ||
    unit.kind === 'education-entry' ||
    unit.kind === 'education-empty' ||
    unit.kind === 'references-entry' ||
    unit.kind === 'references-empty'
  ) {
    return spacing.entryGap
  }

  return spacing.sectionGap
}

function isHeading(unit: FlowUnit): boolean {
  return unit.kind.endsWith('-heading')
}

function gapBefore(
  unit: FlowUnit,
  page: FlowUnit[],
  spacing: DensitySpacing,
  compact: boolean,
): number {
  const prev = page[page.length - 1]
  if (!prev) return 0
  const gap = baseGap(unit, spacing)
  if (compact && isHeading(prev)) {
    return Math.max(gap, COMPACT_MIN_GAP_AFTER_HEADING_PX)
  }
  return gap
}

function packUnits(
  units: FlowUnit[],
  heights: Record<string, number>,
  maxHeight: number,
  spacing: DensitySpacing,
  compact: boolean,
): FlowUnit[][] {
  const gapFor = (unit: FlowUnit, page: FlowUnit[]) =>
    gapBefore(unit, page, spacing, compact)

  // Until measured, keep a single page to avoid wrong multi-page flashes
  if (units.length > 0 && Object.keys(heights).length === 0) {
    return [units]
  }

  const pages: FlowUnit[][] = []
  let current: FlowUnit[] = []
  let used = 0
  const limit = Math.max(80, maxHeight - PAGE_PACK_BUFFER_PX)

  const heightOf = (key: string) => Math.ceil(heights[key] ?? 0)

  const pushContinuedHeading = (
    kind:
      | 'experience'
      | 'education'
      | 'skills'
      | 'certifications'
      | 'references',
  ) => {
    if (kind === 'experience') {
      const cont: FlowUnit = {
        key: `experience-heading-cont-${pages.length}`,
        sectionId: 'experience',
        kind: 'experience-heading',
        continued: true,
      }
      current.push(cont)
      used += heightOf('experience-heading')
    } else if (kind === 'education') {
      const cont: FlowUnit = {
        key: `education-heading-cont-${pages.length}`,
        sectionId: 'education',
        kind: 'education-heading',
        continued: true,
      }
      current.push(cont)
      used += heightOf('education-heading')
    } else if (kind === 'certifications') {
      const cont: FlowUnit = {
        key: `certifications-heading-cont-${pages.length}`,
        sectionId: 'certifications',
        kind: 'certifications-heading',
        continued: true,
      }
      current.push(cont)
      used += heightOf('certifications-heading')
    } else if (kind === 'references') {
      const cont: FlowUnit = {
        key: `references-heading-cont-${pages.length}`,
        sectionId: 'references',
        kind: 'references-heading',
        continued: true,
      }
      current.push(cont)
      used += heightOf('references-heading')
    } else {
      const cont: FlowUnit = {
        key: `skills-heading-cont-${pages.length}`,
        sectionId: 'skills',
        kind: 'skills-heading',
      }
      current.push(cont)
      used += heightOf('skills-heading')
    }
  }

  const startNewPageFor = (unit: FlowUnit) => {
    if (current.length === 0) return
    pages.push(current)
    current = []
    used = 0

    if (
      unit.kind === 'experience-header' ||
      unit.kind === 'experience-bullet'
    ) {
      pushContinuedHeading('experience')
      if (unit.kind === 'experience-bullet') {
        const headerKey = `experience-header-${unit.entryId}`
        const headerUnit = units.find(
          (u) => u.kind === 'experience-header' && u.key === headerKey,
        )
        if (headerUnit && headerUnit.kind === 'experience-header') {
          const contHeader: FlowUnit = {
            ...headerUnit,
            key: `${headerKey}-cont-${pages.length}`,
          }
          const hg = gapFor(contHeader, current)
          current.push(contHeader)
          used += hg + heightOf(headerKey)
        }
      }
    } else if (unit.kind === 'education-entry') {
      pushContinuedHeading('education')
    } else if (unit.kind === 'skills-line') {
      pushContinuedHeading('skills')
    } else if (unit.kind === 'certifications-entry') {
      pushContinuedHeading('certifications')
    } else if (unit.kind === 'references-entry') {
      pushContinuedHeading('references')
    }
  }

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    const h = heightOf(unit.key)
    const gap = gapFor(unit, current)
    let needed = gap + h

    // Keep job header with at least the next bullet when possible
    if (unit.kind === 'experience-header') {
      const next = units[i + 1]
      if (next?.kind === 'experience-bullet' && next.entryId === unit.entry.id) {
        const pairExtra =
          gapFor(next, [...current, unit]) + heightOf(next.key)
        // Only keep them together when the pair fits on a fresh page
        if (h + pairExtra <= limit) {
          needed += pairExtra
        }
      }
    }

    if (current.length > 0 && used + needed > limit) {
      startNewPageFor(unit)
    }

    const g = gapFor(unit, current)
    used += g + h
    current.push(unit)
  }

  if (current.length > 0) pages.push(current)
  if (pages.length === 0) pages.push([])
  return pages
}

function groupBySection(pageUnits: FlowUnit[]): FlowUnit[][] {
  const groups: FlowUnit[][] = []
  for (const unit of pageUnits) {
    const last = groups[groups.length - 1]
    if (last && last[0].sectionId === unit.sectionId) {
      last.push(unit)
    } else {
      groups.push([unit])
    }
  }
  return groups
}

function PageShell({
  children,
  pageIndex,
  styleVars,
  margins,
}: {
  children: ReactNode
  pageIndex: number
  styleVars: CSSProperties
  margins: ResumeStyle['margins']
}) {
  return (
    <article
      data-resume-page={pageIndex}
      className="resume-page relative overflow-hidden bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]"
      style={{
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        paddingTop: margins.top,
        paddingRight: margins.right,
        paddingBottom: margins.bottom,
        paddingLeft: margins.left,
        boxSizing: 'border-box',
        ...styleVars,
      }}
    >
      {children}
    </article>
  )
}

type RenderCtx = {
  resume: ResumeData
  compact: boolean
  spacing: DensitySpacing
}

function renderUnit(unit: FlowUnit, ctx: RenderCtx): ReactNode {
  const { resume, compact, spacing } = ctx
  switch (unit.kind) {
    case 'contact':
      return <ContactBlock resume={resume} compact={compact} />
    case 'summary':
      return <SummaryBlock resume={resume} />
    case 'skills-heading':
      return <SectionHeading>{SECTION_LABELS.skills}</SectionHeading>
    case 'skills-line':
      return <SkillsLine line={unit.line} compact={compact} />
    case 'skills-empty':
      return (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No skills yet.
        </p>
      )
    case 'certifications-heading':
      return (
        <SectionHeading continued={unit.continued}>
          {SECTION_LABELS.certifications}
        </SectionHeading>
      )
    case 'certifications-entry':
      return <CertificationEntryBlock entry={unit.entry} compact={compact} />
    case 'certifications-empty':
      return (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No certifications yet.
        </p>
      )
    case 'references-heading':
      return (
        <SectionHeading continued={unit.continued}>
          {SECTION_LABELS.references}
        </SectionHeading>
      )
    case 'references-entry':
      return <ReferenceEntryBlock entry={unit.entry} compact={compact} />
    case 'references-on-request':
      return (
        <p
          className="font-normal text-zinc-700"
          style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }}
        >
          {REFERENCES_ON_REQUEST_TEXT}
        </p>
      )
    case 'references-empty':
      return (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No references yet.
        </p>
      )
    case 'experience-heading':
      return (
        <SectionHeading continued={unit.continued}>
          {SECTION_LABELS.experience}
        </SectionHeading>
      )
    case 'experience-header':
      return <ExperienceHeaderBlock entry={unit.entry} compact={compact} />
    case 'experience-bullet':
      return <ExperienceBullet bullet={unit.bullet} spacing={spacing} />
    case 'experience-empty':
      return (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No experience yet.
        </p>
      )
    case 'education-heading':
      return (
        <SectionHeading continued={unit.continued}>
          {SECTION_LABELS.education}
        </SectionHeading>
      )
    case 'education-entry':
      return <EducationEntryBlock entry={unit.entry} compact={compact} />
    case 'education-empty':
      return (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No education yet.
        </p>
      )
  }
}

type FitResult = { t: number; fits: boolean }

function measureHeights(root: HTMLElement): Record<string, number> {
  const next: Record<string, number> = {}
  for (const el of root.querySelectorAll<HTMLElement>('[data-measure-id]')) {
    const id = el.dataset.measureId
    if (!id) continue
    // Use offsetHeight (layout px), not getBoundingClientRect — the preview
    // is CSS-scaled, and bounding rects shrink with that transform, which
    // underestimates heights and lets content pack past the page margins.
    const cs = window.getComputedStyle(el)
    const mt = parseFloat(cs.marginTop) || 0
    const mb = parseFloat(cs.marginBottom) || 0
    next[id] = el.offsetHeight + mt + mb
  }
  return next
}

function applyCssVars(el: HTMLElement, vars: Record<string, string>) {
  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith('--')) el.style.setProperty(key, value)
    else if (key === 'fontFamily') el.style.fontFamily = value
  }
}

function FitStatus({ fit, pageCount }: { fit: FitResult; pageCount: number }) {
  if (!fit.fits) {
    return (
      <p className="mb-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        Still {pageCount} pages at the smallest size — trim some content
      </p>
    )
  }
  return (
    <p className="mb-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
      {fit.t === 0 ? 'Fits on one page' : 'Shrunk to fit on one page'}
    </p>
  )
}

export function ResumeDocument({
  resume,
  style: rawStyle,
  onEditSection,
}: ResumeDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [fitResult, setFitResult] = useState<FitResult | null>(null)

  const style = normalizeResumeStyle(rawStyle)
  const compact = style.density === 'compact'
  const baseBodyPx = scaledTypography(style.fontSize).body
  const activeFit = useMemo(
    () =>
      style.fitToPage && fitResult
        ? fitParams(fitResult.t, baseBodyPx)
        : NO_FIT,
    [style.fitToPage, fitResult, baseBodyPx],
  )
  const styleVars = useMemo(
    () => typographyCssVars(style, activeFit) as CSSProperties,
    [style, activeFit],
  )
  const spacing = useMemo(
    () => getSpacing(style.density, activeFit.spacingScale),
    [style.density, activeFit.spacingScale],
  )
  const margins = style.margins
  const contentHeight = pageContentHeight(margins.top, margins.bottom)
  const contentWidth = pageContentWidth(margins.left, margins.right)
  const ctx: RenderCtx = { resume, compact, spacing }

  const units = useMemo(() => buildFlowUnits(resume), [resume])
  const measureKey = useMemo(
    () => JSON.stringify({ resume, style }),
    [resume, style],
  )

  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
    if (!style.fitToPage) {
      setHeights(measureHeights(root))
      setFitResult(null)
      return
    }

    // Measure at each candidate fit level by swapping CSS vars on the hidden
    // measure root, so the search runs in one pass without React re-renders.
    const measured = new Map<number, Record<string, number>>()
    const measureAt = (t: number) => {
      const fit = fitParams(t, baseBodyPx)
      applyCssVars(root, typographyCssVars(style, fit))
      const h = measureHeights(root)
      measured.set(t, h)
      return { h, fit }
    }
    const result = searchFit((t) => {
      const { h, fit } = measureAt(t)
      const sp = getSpacing(style.density, fit.spacingScale)
      return packUnits(units, h, contentHeight, sp, compact).length <= 1
    })
    const final = measured.get(result.t) ?? measureAt(result.t).h
    // Leave the measure root at the chosen level so it matches the next render
    applyCssVars(root, typographyCssVars(style, fitParams(result.t, baseBodyPx)))
    setHeights(final)
    setFitResult(result)
    // measureKey serializes resume + style; every other input derives from them
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [measureKey])

  const pages = useMemo(
    () => packUnits(units, heights, contentHeight, spacing, compact),
    [units, heights, contentHeight, spacing, compact],
  )

  const groupGapFor = (unit: FlowUnit, prev: FlowUnit | undefined) =>
    prev ? gapBefore(unit, [prev], spacing, compact) : 0

  return (
    <div id="resume-document" className="flex flex-col items-center">
      {style.fitToPage && fitResult ? (
        <FitStatus fit={fitResult} pageCount={pages.length} />
      ) : null}
      <div
        aria-hidden
        ref={measureRef}
        className="pointer-events-none absolute left-[-9999px] top-0"
        style={{
          width: contentWidth,
          ...styleVars,
        }}
      >
        {units.map((unit) => (
          <div key={unit.key} data-measure-id={unit.key}>
            {renderUnit(unit, ctx)}
          </div>
        ))}
      </div>

      <div className="flex flex-col" style={{ gap: PAGE_GAP_PX }}>
        {pages.map((pageUnits, pageIndex) => {
          const groups = groupBySection(pageUnits)
          return (
            <PageShell
              key={pageIndex}
              pageIndex={pageIndex}
              styleVars={styleVars}
              margins={margins}
            >
              <div className="flex flex-col">
                {groups.map((group, groupIndex) => {
                  const sectionId = group[0].sectionId
                  const prevGroup = groups[groupIndex - 1]
                  const groupGap = groupGapFor(
                    group[0],
                    prevGroup?.[prevGroup.length - 1],
                  )
                  const isContinued =
                    group[0].key.includes('-cont-') ||
                    ('continued' in group[0] && group[0].continued)

                  const body = (
                    <div>
                      {group.map((unit, i) => (
                        <div
                          key={unit.key}
                          style={{ marginTop: groupGapFor(unit, group[i - 1]) }}
                        >
                          {renderUnit(unit, ctx)}
                        </div>
                      ))}
                    </div>
                  )

                  const wrap = isContinued ? (
                    <div key={`${pageIndex}-${sectionId}-cont-${groupIndex}`}>
                      {body}
                    </div>
                  ) : (
                    <SectionChrome
                      key={`${pageIndex}-${sectionId}-${groupIndex}`}
                      id={sectionId}
                      disableDrag={isPinnedSection(sectionId)}
                      onEdit={() => onEditSection(sectionId)}
                    >
                      {body}
                    </SectionChrome>
                  )

                  return (
                    <div
                      key={`${pageIndex}-group-${groupIndex}`}
                      style={{ marginTop: groupGap }}
                    >
                      {wrap}
                    </div>
                  )
                })}
              </div>
            </PageShell>
          )
        })}
      </div>
    </div>
  )
}
