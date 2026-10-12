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
import { typographyCssVars, normalizeResumeStyle } from '../../lib/typography'
import { SectionChrome } from './SectionChrome'

interface ResumeDocumentProps {
  resume: ResumeData
  style: ResumeStyle
  onEditSection: (id: SectionId) => void
}

const SECTION_GAP_PX = 18
const ENTRY_GAP_PX = 14
const BULLET_GAP_PX = 2
const SKILL_GAP_PX = 2
const ITEM_GAP_PX = 6

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

function ContactBlock({ resume }: { resume: ResumeData }) {
  const { contact } = resume
  const items = contactLinks(contact)

  return (
    <header className="border-b border-zinc-800 pb-3 text-center">
      <h1
        className="font-bold uppercase leading-tight tracking-[0.04em] text-zinc-900"
        style={{ fontSize: 'var(--fs-name)' }}
      >
        {contact.fullName || 'Your Name'}
      </h1>
      {items.length > 0 ? (
        <p
          className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-normal leading-relaxed text-zinc-600"
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
    <section className="flex flex-col gap-2">
      <SectionHeading>{SECTION_LABELS.summary}</SectionHeading>
      {resume.summary.trim() ? (
        <p
          className="font-normal leading-[1.45] text-zinc-700 text-justify"
          style={{ fontSize: 'var(--fs-body)' }}
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

function SkillsLine({ line }: { line: string }) {
  return (
    <p
      className="font-normal leading-[1.45] text-zinc-700"
      style={{ fontSize: 'var(--fs-body)' }}
    >
      {line}
    </p>
  )
}

function ExperienceHeaderBlock({ entry }: { entry: ExperienceEntry }) {
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

function ExperienceBullet({ bullet }: { bullet: string }) {
  return (
    <ul className="list-disc pl-[18px]">
      <li
        className="font-normal leading-[1.4] text-zinc-700"
        style={{ fontSize: 'var(--fs-body)' }}
      >
        {bullet}
      </li>
    </ul>
  )
}

function EducationEntryBlock({ entry }: { entry: EducationEntry }) {
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

function CertificationEntryBlock({ entry }: { entry: CertificationEntry }) {
  const date = formatMonthYear(entry.date)

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

function ReferenceEntryBlock({ entry }: { entry: ReferenceEntry }) {
  const role = referenceRole(entry)
  const contacts = referenceContactItems(entry)

  return (
    <div>
      <p
        className="font-semibold text-zinc-900"
        style={{ fontSize: 'var(--fs-role-title)' }}
      >
        {entry.name || 'Reference'}
      </p>
      {role ? (
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

function gapBefore(unit: FlowUnit, page: FlowUnit[]): number {
  if (page.length === 0) return 0

  if (unit.kind === 'experience-bullet') return BULLET_GAP_PX
  if (unit.kind === 'skills-line') return SKILL_GAP_PX
  if (
    unit.kind === 'certifications-entry' ||
    unit.kind === 'references-on-request'
  ) {
    return ITEM_GAP_PX
  }

  if (
    unit.kind === 'experience-header' ||
    unit.kind === 'experience-empty' ||
    unit.kind === 'education-entry' ||
    unit.kind === 'education-empty' ||
    unit.kind === 'references-entry' ||
    unit.kind === 'references-empty'
  ) {
    return ENTRY_GAP_PX
  }

  return SECTION_GAP_PX
}

function packUnits(
  units: FlowUnit[],
  heights: Record<string, number>,
  maxHeight: number,
): FlowUnit[][] {
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
          const hg = gapBefore(contHeader, current)
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
    const gap = gapBefore(unit, current)
    let needed = gap + h

    // Keep job header with at least the next bullet when possible
    if (unit.kind === 'experience-header') {
      const next = units[i + 1]
      if (next?.kind === 'experience-bullet' && next.entryId === unit.entry.id) {
        const pairExtra =
          gapBefore(next, [...current, unit]) + heightOf(next.key)
        // Only keep them together when the pair fits on a fresh page
        if (h + pairExtra <= limit) {
          needed += pairExtra
        }
      }
    }

    if (current.length > 0 && used + needed > limit) {
      startNewPageFor(unit)
    }

    const g = gapBefore(unit, current)
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

function renderUnit(unit: FlowUnit, resume: ResumeData): ReactNode {
  switch (unit.kind) {
    case 'contact':
      return <ContactBlock resume={resume} />
    case 'summary':
      return <SummaryBlock resume={resume} />
    case 'skills-heading':
      return <SectionHeading>{SECTION_LABELS.skills}</SectionHeading>
    case 'skills-line':
      return <SkillsLine line={unit.line} />
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
      return <CertificationEntryBlock entry={unit.entry} />
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
      return <ReferenceEntryBlock entry={unit.entry} />
    case 'references-on-request':
      return (
        <p
          className="font-normal leading-[1.45] text-zinc-700"
          style={{ fontSize: 'var(--fs-body)' }}
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
      return <ExperienceHeaderBlock entry={unit.entry} />
    case 'experience-bullet':
      return <ExperienceBullet bullet={unit.bullet} />
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
      return <EducationEntryBlock entry={unit.entry} />
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

function unitGap(unit: FlowUnit, prev: FlowUnit | undefined): number {
  if (!prev) return 0
  return gapBefore(unit, [prev])
}

export function ResumeDocument({
  resume,
  style: rawStyle,
  onEditSection,
}: ResumeDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Record<string, number>>({})

  const style = normalizeResumeStyle(rawStyle)
  const styleVars = useMemo(
    () => typographyCssVars(style) as CSSProperties,
    [style],
  )
  const margins = style.margins
  const contentHeight = pageContentHeight(margins.top, margins.bottom)
  const contentWidth = pageContentWidth(margins.left, margins.right)

  const units = useMemo(() => buildFlowUnits(resume), [resume])
  const measureKey = useMemo(
    () => JSON.stringify({ resume, style }),
    [resume, style],
  )

  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
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
    setHeights(next)
  }, [measureKey])

  const pages = useMemo(
    () => packUnits(units, heights, contentHeight),
    [units, heights, contentHeight],
  )

  return (
    <div id="resume-document" className="flex flex-col items-center">
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
            {renderUnit(unit, resume)}
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
                  const groupGap = prevGroup
                    ? gapBefore(group[0], [prevGroup[prevGroup.length - 1]])
                    : 0
                  const isContinued =
                    group[0].key.includes('-cont-') ||
                    ('continued' in group[0] && group[0].continued)

                  const body = (
                    <div>
                      {group.map((unit, i) => (
                        <div
                          key={unit.key}
                          style={{ marginTop: unitGap(unit, group[i - 1]) }}
                        >
                          {renderUnit(unit, resume)}
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
