export type SectionId =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'references'

export interface Contact {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  /** URL; `websiteLabel` is the text shown (falls back to a tidied URL). */
  website: string
  websiteLabel: string
  /** URL or handle; `linkedinLabel` is the text shown. */
  linkedin: string
  linkedinLabel: string
  /** Square JPEG data URL, resized client-side. */
  photo?: string
}

export interface ExperienceEntry {
  id: string
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface EducationEntry {
  id: string
  school: string
  degree: string
  location: string
  startDate: string
  endDate: string
  details: string
}

export interface CertificationEntry {
  id: string
  name: string
  issuer: string
  /** YYYY-MM, or empty when undated. */
  date: string
}

export interface ReferenceEntry {
  id: string
  name: string
  title: string
  company: string
  /** How the reference knows you, e.g. "Former manager at Brightline". */
  relationship: string
  phone: string
  email: string
}

export type ResumeFontId =
  | 'georgia'
  | 'times'
  | 'garamond'
  | 'arial'
  | 'calibri'

export type FontSizeId = 'small' | 'medium' | 'large'

export type ResumeDensity = 'normal' | 'compact'

export interface PageMargins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ResumeStyle {
  fontFamily: ResumeFontId
  fontSize: FontSizeId
  margins: PageMargins
  density: ResumeDensity
  /** Shrink spacing, then font size, until the resume fits on one page. */
  fitToPage: boolean
}

export interface ResumeData {
  contact: Contact
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
  certifications: CertificationEntry[]
  references: ReferenceEntry[]
  /** Show "References available upon request." instead of the entries. */
  referencesOnRequest: boolean
  sectionOrder: SectionId[]
  hiddenSections: SectionId[]
}

export interface SavedResume {
  id: string
  name: string
  updatedAt: string
  resume: ResumeData
  style: ResumeStyle
}

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'references',
]

export const SECTION_LABELS: Record<SectionId, string> = {
  contact: 'Contact',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  references: 'References',
}

/** Shown in place of the entries when `referencesOnRequest` is on. */
export const REFERENCES_ON_REQUEST_TEXT = 'References available upon request.'
