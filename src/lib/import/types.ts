import type { ImportedResume } from '../resumeFile'

export type { ImportedResume }

export type ResumeImporter = {
  id: string
  label: string
  accept: string
  parse: (file: File) => Promise<ImportedResume>
}
