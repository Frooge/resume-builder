const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Format YYYY-MM as "August 2024". */
export function formatMonthYear(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
  if (!match) return trimmed

  const year = match[1]
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) return trimmed

  return `${MONTHS_FULL[monthIndex]} ${year}`
}

export function formatYear(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/^(\d{4})/)
  return match ? match[1] : trimmed
}

export function formatDateRange(
  start: string,
  end: string,
  current?: boolean,
): string {
  const s = formatMonthYear(start)
  const e = current ? 'Present' : formatMonthYear(end)
  if (!s && !e) return ''
  if (!e) return s
  if (!s) return e
  return `${s} – ${e}`
}

/** Education-style year span: "2020 – 2024" */
export function formatYearRange(
  start: string,
  end: string,
  current?: boolean,
): string {
  const s = formatYear(start)
  const e = current ? 'Present' : formatYear(end)
  if (!s && !e) return ''
  if (!e) return s
  if (!s) return e
  return `${s} – ${e}`
}
