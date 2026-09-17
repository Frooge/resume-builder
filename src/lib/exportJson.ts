import { saveAs } from 'file-saver'
import type { ResumeData, ResumeStyle } from '../types/resume'
import { resumeFileToJson } from './resumeFile'
import { DEFAULT_RESUME_STYLE } from './typography'

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume'
  )
}

export async function exportJson(
  resume: ResumeData,
  fileName: string,
  style: ResumeStyle = DEFAULT_RESUME_STYLE,
): Promise<void> {
  const blob = new Blob([resumeFileToJson(resume, style, fileName)], {
    type: 'application/json',
  })
  saveAs(blob, `${slugify(fileName)}.json`)
}
