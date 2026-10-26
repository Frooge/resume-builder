import type {
  CertificationEntry,
  Contact,
  EducationEntry,
  ExperienceEntry,
  FontSizeId,
  ReferenceEntry,
  ResumeData,
  ResumeDensity,
  ResumeFontId,
  ResumeStyle,
  SectionId,
} from '../types/resume'
import { DEFAULT_SECTION_ORDER } from '../types/resume'
import { createId } from './sampleResume'
import { withPinnedFirst } from './sectionOrder'
import { DEFAULT_RESUME_STYLE, normalizeResumeStyle } from './typography'

export const RESUME_FILE_KIND = 'resume-builder'
/** v2: certifications became `{ name, issuer, date }` entries (v1 had strings). */
export const RESUME_FILE_VERSION = 2
const SUPPORTED_FILE_VERSIONS = new Set([1, RESUME_FILE_VERSION])

export type ResumeExport = {
  version: typeof RESUME_FILE_VERSION
  kind: typeof RESUME_FILE_KIND
  name: string
  exportedAt: string
  resume: ResumeData
  style: ResumeStyle
}

export type ImportedResume = {
  name: string
  resume: ResumeData
  style: ResumeStyle
}

export class ResumeFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResumeFileError'
  }
}

const FONT_IDS = new Set<ResumeFontId>([
  'georgia',
  'times',
  'garamond',
  'arial',
  'calibri',
])
const SIZE_IDS = new Set<FontSizeId>(['small', 'medium', 'large'])
const DENSITY_IDS = new Set<ResumeDensity>(['normal', 'compact'])
const SECTION_IDS = new Set<SectionId>(DEFAULT_SECTION_ORDER)

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function parseContact(raw: unknown): Contact {
  const o = isObj(raw) ? raw : {}
  const photo = asString(o.photo)
  return {
    fullName: asString(o.fullName),
    title: asString(o.title),
    email: asString(o.email),
    phone: asString(o.phone),
    location: asString(o.location),
    website: asString(o.website),
    websiteLabel: asString(o.websiteLabel),
    linkedin: asString(o.linkedin),
    linkedinLabel: asString(o.linkedinLabel),
    ...(photo.startsWith('data:image/') ? { photo } : {}),
  }
}

function parseExperience(raw: unknown): ExperienceEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const o = isObj(item) ? item : {}
    const id = asString(o.id).trim()
    return {
      id: id || createId('exp'),
      company: asString(o.company),
      role: asString(o.role),
      location: asString(o.location),
      startDate: asString(o.startDate),
      endDate: asString(o.endDate),
      current: o.current === true,
      bullets: Array.isArray(o.bullets) ? o.bullets.map(asString) : [''],
    }
  })
}

function parseEducation(raw: unknown): EducationEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const o = isObj(item) ? item : {}
    const id = asString(o.id).trim()
    return {
      id: id || createId('edu'),
      school: asString(o.school),
      degree: asString(o.degree),
      location: asString(o.location),
      startDate: asString(o.startDate),
      endDate: asString(o.endDate),
      details: asString(o.details),
    }
  })
}

/** Accepts v1's plain strings as well as entry objects. */
function parseCertifications(raw: unknown): CertificationEntry[] {
  if (!Array.isArray(raw)) return []
  const entries: CertificationEntry[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      if (item.trim()) {
        entries.push({
          id: createId('cert'),
          name: item.trim(),
          issuer: '',
          date: '',
        })
      }
      continue
    }
    const o = isObj(item) ? item : {}
    const id = asString(o.id).trim()
    entries.push({
      id: id || createId('cert'),
      name: asString(o.name),
      issuer: asString(o.issuer),
      date: asString(o.date),
    })
  }
  return entries
}

function parseReferences(raw: unknown): ReferenceEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const o = isObj(item) ? item : {}
    const id = asString(o.id).trim()
    return {
      id: id || createId('ref'),
      name: asString(o.name),
      title: asString(o.title),
      company: asString(o.company),
      relationship: asString(o.relationship),
      phone: asString(o.phone),
      email: asString(o.email),
    }
  })
}

function parseSectionOrder(raw: unknown): SectionId[] {
  const seen = new Set<SectionId>()
  const order: SectionId[] = []
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id !== 'string') continue
      if (!SECTION_IDS.has(id as SectionId) || seen.has(id as SectionId)) continue
      seen.add(id as SectionId)
      order.push(id as SectionId)
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id)) order.push(id)
  }
  return withPinnedFirst(order)
}

function parseLines(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.map(asString) : []
}

function parseHiddenSections(raw: unknown): SectionId[] {
  if (!Array.isArray(raw)) return []
  const hidden = new Set<SectionId>()
  for (const id of raw) {
    if (SECTION_IDS.has(id as SectionId) && id !== 'contact') {
      hidden.add(id as SectionId)
    }
  }
  return [...hidden]
}

/** Validate resume data field by field, defaulting anything missing. */
export function parseResumeData(raw: unknown): ResumeData {
  const o = isObj(raw) ? raw : {}
  return {
    contact: parseContact(o.contact),
    summary: asString(o.summary),
    experience: parseExperience(o.experience),
    education: parseEducation(o.education),
    skills: parseLines(o.skills),
    certifications: parseCertifications(o.certifications),
    references: parseReferences(o.references),
    referencesOnRequest: o.referencesOnRequest === true,
    sectionOrder: parseSectionOrder(o.sectionOrder),
    hiddenSections: parseHiddenSections(o.hiddenSections),
  }
}

function parseStyle(raw: unknown): ResumeStyle {
  const o = isObj(raw) ? raw : {}
  const fontFamily = FONT_IDS.has(o.fontFamily as ResumeFontId)
    ? (o.fontFamily as ResumeFontId)
    : DEFAULT_RESUME_STYLE.fontFamily
  const fontSize = SIZE_IDS.has(o.fontSize as FontSizeId)
    ? (o.fontSize as FontSizeId)
    : DEFAULT_RESUME_STYLE.fontSize
  const density = DENSITY_IDS.has(o.density as ResumeDensity)
    ? (o.density as ResumeDensity)
    : DEFAULT_RESUME_STYLE.density
  const fitToPage =
    typeof o.fitToPage === 'boolean'
      ? o.fitToPage
      : DEFAULT_RESUME_STYLE.fitToPage
  const rawMargins = isObj(o.margins) ? o.margins : {}
  const style = normalizeResumeStyle({
    fontFamily,
    fontSize,
    density,
    fitToPage,
  })
  return {
    ...style,
    margins: {
      ...style.margins,
      ...(typeof rawMargins.top === 'number' ? { top: rawMargins.top } : {}),
      ...(typeof rawMargins.right === 'number' ? { right: rawMargins.right } : {}),
      ...(typeof rawMargins.bottom === 'number'
        ? { bottom: rawMargins.bottom }
        : {}),
      ...(typeof rawMargins.left === 'number' ? { left: rawMargins.left } : {}),
    },
  }
}

export function serializeResumeFile(
  resume: ResumeData,
  style: ResumeStyle,
  name: string,
): ResumeExport {
  return {
    version: RESUME_FILE_VERSION,
    kind: RESUME_FILE_KIND,
    name: name.trim() || resume.contact.fullName.trim() || 'Untitled resume',
    exportedAt: new Date().toISOString(),
    resume,
    style: normalizeResumeStyle(style),
  }
}

export function resumeFileToJson(
  resume: ResumeData,
  style: ResumeStyle,
  name: string,
): string {
  return `${JSON.stringify(serializeResumeFile(resume, style, name), null, 2)}\n`
}

export function parseResumeFile(raw: unknown): ImportedResume {
  if (!isObj(raw)) {
    throw new ResumeFileError('This file is not a resume JSON export.')
  }
  if (raw.kind !== RESUME_FILE_KIND) {
    throw new ResumeFileError('This JSON is not a resume-builder export.')
  }
  if (!SUPPORTED_FILE_VERSIONS.has(raw.version as number)) {
    throw new ResumeFileError('This export version is not supported.')
  }
  if (!isObj(raw.resume)) {
    throw new ResumeFileError('This export is missing resume data.')
  }

  const resume = parseResumeData(raw.resume)

  const name =
    asString(raw.name).trim() || resume.contact.fullName.trim() || 'Untitled resume'

  return {
    name,
    resume,
    style: parseStyle(raw.style),
  }
}

export function parseResumeFileText(text: string): ImportedResume {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ResumeFileError('This file is not valid JSON.')
  }
  return parseResumeFile(raw)
}
