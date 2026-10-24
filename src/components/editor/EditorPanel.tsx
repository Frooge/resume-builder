import { useEffect, useRef, type ComponentType } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { isPinnedSection } from '../../lib/sectionOrder'
import { useResumeStore } from '../../store/resumeStore'
import { toast } from '../../store/toastStore'
import type { SectionId } from '../../types/resume'
import { sectionCollisionDetection, useSectionSensors } from '../sectionDnd'
import { AccordionSection } from './fields'
import { CertificationsEditor } from './sections/CertificationsEditor'
import { ContactEditor } from './sections/ContactEditor'
import { EducationEditor } from './sections/EducationEditor'
import { ExperienceEditor } from './sections/ExperienceEditor'
import { ReferencesEditor } from './sections/ReferencesEditor'
import { SkillsEditor } from './sections/SkillsEditor'
import { SummaryEditor } from './sections/SummaryEditor'

const SECTION_EDITORS: Record<SectionId, ComponentType> = {
  contact: ContactEditor,
  summary: SummaryEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  certifications: CertificationsEditor,
  references: ReferencesEditor,
}

export function EditorPanel() {
  const sectionOrder = useResumeStore((s) => s.resume.sectionOrder)
  const moveSection = useResumeStore((s) => s.moveSection)
  const focusRequest = useResumeStore((s) => s.ui.focusSectionRequest)
  const clearFocusSectionRequest = useResumeStore(
    (s) => s.clearFocusSectionRequest,
  )
  const resetToSample = useResumeStore((s) => s.resetToSample)
  const panelRef = useRef<HTMLElement>(null)

  const sensors = useSectionSensors()

  const sortableIds = sectionOrder.filter((id) => !isPinnedSection(id))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over) moveSection(active.id as SectionId, over.id as SectionId)
  }

  useEffect(() => {
    if (!focusRequest) return
    const el = document.getElementById(`editor-section-${focusRequest}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    clearFocusSectionRequest()
  }, [focusRequest, clearFocusSectionRequest])

  return (
    <aside
      ref={panelRef}
      className="flex h-full w-[30%] min-w-[320px] max-w-[420px] flex-col border-r border-zinc-200 bg-white"
    >
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Resume Builder</h1>
          <p className="text-xs text-zinc-500">Edit details on the left</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetToSample()
            toast.success('Reset to the sample resume')
          }}
          className="text-xs text-zinc-500 hover:text-zinc-800 hover:underline"
        >
          Reset sample
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={sectionCollisionDetection}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {sectionOrder.map((id) => {
              const Editor = SECTION_EDITORS[id]
              return (
                <AccordionSection key={id} id={id}>
                  <Editor />
                </AccordionSection>
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  )
}
