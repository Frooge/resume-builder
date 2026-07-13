import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type {
  EducationEntry,
  ExperienceEntry,
  ResumeData,
  ResumeStyle,
  SectionId,
} from '../../types/resume'
import { SECTION_LABELS } from '../../types/resume'
import { formatDateRange, formatYearRange } from '../../lib/formatDate'
import {
  PAGE_CONTENT_HEIGHT_PX,
  PAGE_GAP_PX,
  PAGE_HEIGHT_PX,
  PAGE_PADDING_X_PX,
  PAGE_PADDING_Y_PX,
  PAGE_WIDTH_PX,
} from '../../lib/pageSize'
import { typographyCssVars } from '../../lib/typography'
import { SectionChrome } from './SectionChrome'

interface ResumeDocumentProps {
  resume: ResumeData
  style: ResumeStyle
  onEditSection: (id: SectionId) => void
}

const SECTION_GAP_PX = 18
const ENTRY_GAP_PX = 14

type FlowUnit =
  | { key: string; sectionId: SectionId; kind: 'contact' }
  | { key: string; sectionId: SectionId; kind: 'summary' }
  | { key: string; sectionId: SectionId; kind: 'skills' }
  | {
      key: string
      sectionId: 'experience'
      kind: 'experience-heading'
      continued: boolean
    }
  | {
      key: string
      sectionId: 'experience'
      kind: 'experience-entry'
      entry: ExperienceEntry
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

function displayLinkedIn(value: string): string {
  return value
    .replace(/^https?:\/\//, '')
    .replace(/^(www\.)?linkedin\.com\//, '')
    .replace(/^in\//, 'in/')
}

function displayWebsite(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function IconPin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.3 18.3H5.7V9.7h2.6v8.6zM7 8.4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.3 9.9h-2.6v-4.2c0-1-.4-1.7-1.5-1.7-.8 0-1.3.5-1.5 1-.1.2-.1.5-.1.8v4.1H9.9s.05-6.7 0-7.4h2.6v1.1c.3-.5 1-1.3 2.4-1.3 1.8 0 3.1 1.2 3.1 3.7v3.9z" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-2.8a15 15 0 00-1.3-3.3A8 8 0 0118.9 8zM12 4c.7 0 2 1.7 2.6 4H9.4C10 5.7 11.3 4 12 4zM4.3 14a8 8 0 010-4h3.2a17 17 0 000 4H4.3zM5.1 16h2.8c.3 1.2.7 2.4 1.3 3.3A8 8 0 015.1 16zM8.1 8H5.1a8 8 0 014.1-3.3A15 15 0 008.1 8zM12 20c-.7 0-2-1.7-2.6-4h5.2c-.6 2.3-1.9 4-2.6 4zm2.7-6H9.3a15 15 0 010-4h5.4a15 15 0 010 4zm.1 5.3c.6-.9 1-2.1 1.3-3.3h2.8a8 8 0 01-4.1 3.3zM16.7 14h3a8 8 0 000-4h-3a17 17 0 010 4z" />
    </svg>
  )
}

function ContactItem({
  icon,
  children,
}: {
  icon: ReactNode
  children: string
}) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="text-zinc-600">{icon}</span>
      <span>{children}</span>
    </span>
  )
}

function ContactBlock({ resume }: { resume: ResumeData }) {
  const { contact } = resume
  const items: { key: string; icon: ReactNode; text: string }[] = []

  if (contact.location) {
    items.push({ key: 'location', icon: <IconPin />, text: contact.location })
  }
  if (contact.email) {
    items.push({ key: 'email', icon: <IconMail />, text: contact.email })
  }
  if (contact.phone) {
    items.push({ key: 'phone', icon: <IconPhone />, text: contact.phone })
  }
  if (contact.linkedin) {
    items.push({
      key: 'linkedin',
      icon: <IconLinkedIn />,
      text: displayLinkedIn(contact.linkedin),
    })
  }
  if (contact.website) {
    items.push({
      key: 'website',
      icon: <IconGlobe />,
      text: displayWebsite(contact.website),
    })
  }

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
            <ContactItem key={item.key} icon={item.icon}>
              {item.text}
            </ContactItem>
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
      className="mb-2 border-b border-zinc-800 pb-[3px] font-bold uppercase tracking-[0.06em] text-zinc-800"
      style={{ fontSize: 'var(--fs-section-heading)' }}
    >
      {children}
      {continued ? ' (cont.)' : ''}
    </h2>
  )
}

function SummaryBlock({ resume }: { resume: ResumeData }) {
  return (
    <section>
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

function SkillsBlock({ resume }: { resume: ResumeData }) {
  const skills = resume.skills.map((s) => s.trim()).filter(Boolean)
  return (
    <section>
      <SectionHeading>{SECTION_LABELS.skills}</SectionHeading>
      {skills.length === 0 ? (
        <p
          className="italic text-zinc-400"
          style={{ fontSize: 'var(--fs-muted)' }}
        >
          No skills yet.
        </p>
      ) : (
        <div className="space-y-0.5">
          {skills.map((line) => (
            <p
              key={line}
              className="font-normal leading-[1.45] text-zinc-700"
              style={{ fontSize: 'var(--fs-body)' }}
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

function ExperienceEntryBlock({ entry }: { entry: ExperienceEntry }) {
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
      <ul className="mt-1 list-disc space-y-[2px] pl-[18px]">
        {entry.bullets
          .map((b) => b.trim())
          .filter(Boolean)
          .map((bullet, i) => (
            <li
              key={i}
              className="font-normal leading-[1.4] text-zinc-700"
              style={{ fontSize: 'var(--fs-body)' }}
            >
              {bullet}
            </li>
          ))}
      </ul>
    </div>
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

function buildFlowUnits(resume: ResumeData): FlowUnit[] {
  const body = resume.sectionOrder.filter(
    (id): id is Exclude<SectionId, 'contact'> => id !== 'contact',
  )
  const units: FlowUnit[] = [
    { key: 'contact', sectionId: 'contact', kind: 'contact' },
  ]

  for (const id of body) {
    if (id === 'summary') {
      units.push({ key: 'summary', sectionId: 'summary', kind: 'summary' })
      continue
    }
    if (id === 'skills') {
      units.push({ key: 'skills', sectionId: 'skills', kind: 'skills' })
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
        for (const entry of resume.experience) {
          units.push({
            key: `experience-${entry.id}`,
            sectionId: 'experience',
            kind: 'experience-entry',
            entry,
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
        for (const entry of resume.education) {
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

function packUnits(
  units: FlowUnit[],
  heights: Record<string, number>,
  maxHeight: number,
): FlowUnit[][] {
  const pages: FlowUnit[][] = []
  let current: FlowUnit[] = []
  let used = 0

  const gapBefore = (unit: FlowUnit, page: FlowUnit[]) => {
    if (page.length === 0) return 0
    if (
      unit.kind === 'experience-entry' ||
      unit.kind === 'education-entry' ||
      unit.kind === 'experience-empty' ||
      unit.kind === 'education-empty'
    ) {
      return ENTRY_GAP_PX
    }
    return SECTION_GAP_PX
  }

  for (const unit of units) {
    const h = heights[unit.key] ?? 0
    const gap = gapBefore(unit, current)

    if (current.length > 0 && used + gap + h > maxHeight) {
      pages.push(current)
      current = []
      used = 0

      if (unit.kind === 'experience-entry') {
        const cont: FlowUnit = {
          key: `experience-heading-cont-${pages.length}`,
          sectionId: 'experience',
          kind: 'experience-heading',
          continued: true,
        }
        current.push(cont)
        used += heights['experience-heading'] ?? 24
      } else if (unit.kind === 'education-entry') {
        const cont: FlowUnit = {
          key: `education-heading-cont-${pages.length}`,
          sectionId: 'education',
          kind: 'education-heading',
          continued: true,
        }
        current.push(cont)
        used += heights['education-heading'] ?? 24
      }
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
}: {
  children: ReactNode
  pageIndex: number
  styleVars: CSSProperties
}) {
  return (
    <article
      data-resume-page={pageIndex}
      className="resume-page relative overflow-hidden bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]"
      style={{
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        padding: `${PAGE_PADDING_Y_PX}px ${PAGE_PADDING_X_PX}px`,
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
    case 'skills':
      return <SkillsBlock resume={resume} />
    case 'experience-heading':
      return (
        <SectionHeading continued={unit.continued}>
          {SECTION_LABELS.experience}
        </SectionHeading>
      )
    case 'experience-entry':
      return <ExperienceEntryBlock entry={unit.entry} />
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

function unitGap(unit: FlowUnit, isFirstInGroup: boolean): number {
  if (isFirstInGroup) return 0
  if (
    unit.kind === 'experience-entry' ||
    unit.kind === 'education-entry' ||
    unit.kind === 'experience-empty' ||
    unit.kind === 'education-empty'
  ) {
    return ENTRY_GAP_PX
  }
  return 0
}

export function ResumeDocument({
  resume,
  style,
  onEditSection,
}: ResumeDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Record<string, number>>({})

  const styleVars = useMemo(
    () => typographyCssVars(style) as CSSProperties,
    [style],
  )
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
      if (id) next[id] = el.getBoundingClientRect().height
    }
    setHeights(next)
  }, [measureKey])

  const pages = useMemo(
    () => packUnits(units, heights, PAGE_CONTENT_HEIGHT_PX),
    [units, heights],
  )

  return (
    <div id="resume-document" className="flex flex-col items-center">
      <div
        aria-hidden
        ref={measureRef}
        className="pointer-events-none absolute left-[-9999px] top-0"
        style={{
          width: PAGE_WIDTH_PX - PAGE_PADDING_X_PX * 2,
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
            <PageShell key={pageIndex} pageIndex={pageIndex} styleVars={styleVars}>
              <div className="flex flex-col" style={{ gap: SECTION_GAP_PX }}>
                {groups.map((group) => {
                  const sectionId = group[0].sectionId
                  const isContinued =
                    group[0].kind === 'experience-heading' ||
                    group[0].kind === 'education-heading'
                      ? group[0].continued
                      : false

                  const body = (
                    <div>
                      {group.map((unit, i) => (
                        <div
                          key={unit.key}
                          style={{ marginTop: unitGap(unit, i === 0) }}
                        >
                          {renderUnit(unit, resume)}
                        </div>
                      ))}
                    </div>
                  )

                  if (isContinued) {
                    return (
                      <div key={`${pageIndex}-${sectionId}-cont`}>{body}</div>
                    )
                  }

                  return (
                    <SectionChrome
                      key={`${pageIndex}-${sectionId}`}
                      id={sectionId}
                      disableDrag={sectionId === 'contact'}
                      onEdit={() => onEditSection(sectionId)}
                    >
                      {body}
                    </SectionChrome>
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
