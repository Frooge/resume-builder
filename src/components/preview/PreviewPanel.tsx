import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useRef } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import type { SectionId } from '../../types/resume'
import { DownloadMenu } from './DownloadMenu'
import { AppearanceMenu } from './AppearanceMenu'
import { LibraryToolbar } from './LibraryToolbar'
import { ResumeDocument } from './ResumeDocument'

export function PreviewPanel() {
  const resume = useResumeStore((s) => s.resume)
  const style = useResumeStore((s) => s.style)
  const reorderSections = useResumeStore((s) => s.reorderSections)
  const requestFocusSection = useResumeStore((s) => s.requestFocusSection)
  const paperRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const sortableIds = resume.sectionOrder.filter((id) => id !== 'contact')

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = resume.sectionOrder.indexOf(active.id as SectionId)
    const newIndex = resume.sectionOrder.indexOf(over.id as SectionId)
    if (oldIndex < 0 || newIndex < 0) return
    reorderSections(arrayMove(resume.sectionOrder, oldIndex, newIndex))
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
            collisionDetection={closestCenter}
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
