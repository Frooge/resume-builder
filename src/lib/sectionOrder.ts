import type { ResumeData, SectionId } from '../types/resume'

/** Sections locked at the top of the resume, in this order; never draggable. */
export const PINNED_SECTIONS: SectionId[] = ['contact', 'summary']

export function isPinnedSection(id: SectionId): boolean {
  return PINNED_SECTIONS.includes(id)
}

/** Enforce the pinned sections first, keeping the rest in their current order. */
export function withPinnedFirst(order: SectionId[]): SectionId[] {
  const rest = order.filter((id) => !isPinnedSection(id))
  return [...PINNED_SECTIONS.filter((id) => order.includes(id)), ...rest]
}

/**
 * Move `activeId` to `overId`'s slot. Dropping onto a pinned section means
 * "as high as allowed": the first movable slot. Pinned or unknown active ids
 * leave the order unchanged.
 */
export function moveSection(
  order: SectionId[],
  activeId: SectionId,
  overId: SectionId,
): SectionId[] {
  if (activeId === overId || isPinnedSection(activeId)) return order
  const from = order.indexOf(activeId)
  const to = isPinnedSection(overId)
    ? order.findIndex((id) => !isPinnedSection(id))
    : order.indexOf(overId)
  if (from < 0 || to < 0) return order
  const next = [...order]
  next.splice(to, 0, ...next.splice(from, 1))
  return withPinnedFirst(next)
}

/** Body sections to render, in order: excludes contact and hidden sections. */
export function visibleSectionOrder(
  resume: ResumeData,
): Exclude<SectionId, 'contact'>[] {
  return resume.sectionOrder.filter(
    (id): id is Exclude<SectionId, 'contact'> =>
      id !== 'contact' && !resume.hiddenSections.includes(id),
  )
}
