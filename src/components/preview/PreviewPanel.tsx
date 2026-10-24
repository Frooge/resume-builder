import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useRef } from 'react'
import { isPinnedSection, visibleSectionOrder } from '../../lib/sectionOrder'
import { useResumeStore } from '../../store/resumeStore'
import type { SectionId } from '../../types/resume'
import { sectionCollisionDetection, useSectionSensors } from '../sectionDnd'
import { DownloadMenu } from './DownloadMenu'
import { AppearanceMenu } from './AppearanceMenu'
import { LibraryToolbar } from './LibraryToolbar'
import { ResumeDocument } from './ResumeDocument'

export function PreviewPanel() {
  const resume = useResumeStore((s) => s.resume)
  const style = useResumeStore((s) => s.style)
  const moveSection = useResumeStore((s) => s.moveSection)
  const requestFocusSection = useResumeStore((s) => s.requestFocusSection)
  const paperRef = useRef<HTMLDivElement>(null)

  const sensors = useSectionSensors()

  const sortableIds = visibleSectionOrder(resume).filter(
    (id) => !isPinnedSection(id),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over) moveSection(active.id as SectionId, over.id as SectionId)
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-zinc-100">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Preview</p>
          <p className="text-xs text-zinc-500">
            Hover a section to edit or reorder
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LibraryToolbar />
          <AppearanceMenu />
          <DownloadMenu />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div ref={paperRef} className="mx-auto w-fit origin-top scale-[0.82]">
          <DndContext
            sensors={sensors}
            collisionDetection={sectionCollisionDetection}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <ResumeDocument
                resume={resume}
                style={style}
                onEditSection={requestFocusSection}
              />
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </section>
  )
}
