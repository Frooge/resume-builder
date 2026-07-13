export type SectionId =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'

export interface Contact {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
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

export type ResumeFontId =
  | 'georgia'
  | 'times'
  | 'garamond'
  | 'arial'
  | 'calibri'

export type FontSizeId = 'small' | 'medium' | 'large'

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
}

export interface ResumeData {
  contact: Contact
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
  sectionOrder: SectionId[]
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
]

export const SECTION_LABELS: Record<SectionId, string> = {
  contact: 'Contact',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
}
