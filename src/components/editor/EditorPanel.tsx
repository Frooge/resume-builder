import { useEffect, useRef } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { AccordionSection } from './fields'
import { ContactEditor } from './sections/ContactEditor'
import { EducationEditor } from './sections/EducationEditor'
import { ExperienceEditor } from './sections/ExperienceEditor'
import { SkillsEditor } from './sections/SkillsEditor'
import { SummaryEditor } from './sections/SummaryEditor'

export function EditorPanel() {
  const focusRequest = useResumeStore((s) => s.ui.focusSectionRequest)
  const clearFocusSectionRequest = useResumeStore(
    (s) => s.clearFocusSectionRequest,
  )
  const resetToSample = useResumeStore((s) => s.resetToSample)
  const panelRef = useRef<HTMLElement>(null)

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
          onClick={resetToSample}
          className="text-xs text-zinc-500 hover:text-zinc-800 hover:underline"
        >
          Reset sample
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <AccordionSection id="contact">
          <ContactEditor />
        </AccordionSection>
        <AccordionSection id="summary">
          <SummaryEditor />
        </AccordionSection>
        <AccordionSection id="experience">
          <ExperienceEditor />
        </AccordionSection>
        <AccordionSection id="education">
          <EducationEditor />
        </AccordionSection>
        <AccordionSection id="skills">
          <SkillsEditor />
        </AccordionSection>
      </div>
    </aside>
  )
}
