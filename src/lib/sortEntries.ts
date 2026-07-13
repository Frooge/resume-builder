import type { EducationEntry, ExperienceEntry } from '../types/resume'

/** YYYY-MM comparable key; current/empty end sorts as most recent. */
function endKey(endDate: string, current?: boolean): string {
  if (current) return '9999-12'
  if (!endDate.trim()) return '0000-01'
  return endDate.trim()
}

function startKey(startDate: string): string {
  return startDate.trim() || '0000-01'
}

/** Current roles first, then newest end date, then newest start date. */
export function sortExperience(entries: ExperienceEntry[]): ExperienceEntry[] {
  return [...entries].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1

    const endCmp = endKey(b.endDate, b.current).localeCompare(
      endKey(a.endDate, a.current),
    )
    if (endCmp !== 0) return endCmp

    const startCmp = startKey(b.startDate).localeCompare(startKey(a.startDate))
    if (startCmp !== 0) return startCmp

    return a.id.localeCompare(b.id)
  })
}

/** Newest graduation/end first, then newest start. */
export function sortEducation(entries: EducationEntry[]): EducationEntry[] {
  return [...entries].sort((a, b) => {
    const endCmp = endKey(b.endDate).localeCompare(endKey(a.endDate))
    if (endCmp !== 0) return endCmp

    const startCmp = startKey(b.startDate).localeCompare(startKey(a.startDate))
    if (startCmp !== 0) return startCmp

    return a.id.localeCompare(b.id)
  })
}
