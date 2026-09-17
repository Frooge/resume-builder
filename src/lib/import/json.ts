import { parseResumeFileText } from '../resumeFile'
import type { ResumeImporter } from './types'

export const jsonImporter: ResumeImporter = {
  id: 'json',
  label: 'JSON file…',
  accept: '.json,application/json',
  async parse(file) {
    return parseResumeFileText(await file.text())
  },
}
