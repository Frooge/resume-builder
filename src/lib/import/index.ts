import { jsonImporter } from './json'
import type { ResumeImporter } from './types'

export type { ImportedResume, ResumeImporter } from './types'

/** Register additional sources here (PDF, DOCX, etc.) as they land. */
export const resumeImporters: ResumeImporter[] = [jsonImporter]
