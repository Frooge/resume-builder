import { useEffect, useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import {
  ToolbarMenu,
  ToolbarMenuItem,
  ToolbarSplitMenu,
} from './ToolbarMenu'

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function LibraryToolbar() {
  const resume = useResumeStore((s) => s.resume)
  const savedResumes = useResumeStore((s) => s.savedResumes)
  const activeSavedId = useResumeStore((s) => s.activeSavedId)
  const saveCurrent = useResumeStore((s) => s.saveCurrent)
  const saveAsNew = useResumeStore((s) => s.saveAsNew)
  const loadSaved = useResumeStore((s) => s.loadSaved)
  const deleteSaved = useResumeStore((s) => s.deleteSaved)
  const newResume = useResumeStore((s) => s.newResume)

  const activeName =
    savedResumes.find((s) => s.id === activeSavedId)?.name ?? ''
  const defaultName = activeName || resume.contact.fullName.trim() || ''

  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!status) return
    const t = window.setTimeout(() => setStatus(null), 2000)
    return () => window.clearTimeout(t)
  }, [status])

  const resolveName = () => {
    if (activeName) return activeName
    if (resume.contact.fullName.trim()) return resume.contact.fullName.trim()
    const typed = window.prompt('Name this resume', 'Untitled resume')
    return typed?.trim() || 'Untitled resume'
  }

  const handleSave = () => {
    saveCurrent(resolveName())
    setStatus('Saved')
  }

  const handleSaveAsNew = (close: () => void) => {
    const name =
      window.prompt(
        'Save as new resume',
        defaultName || 'Untitled resume',
      )?.trim() ||
      defaultName ||
      'Untitled resume'
    saveAsNew(name)
    setStatus('Saved as new')
    close()
  }

  const handleLoad = (id: string, close: () => void) => {
    if (id === activeSavedId) {
      close()
      return
    }
    if (
      !window.confirm(
        'Load this resume? Your current editor content will be replaced.',
      )
    ) {
      return
    }
    loadSaved(id)
    close()
  }

  return (
    <div className="flex items-center gap-2">
      <ToolbarSplitMenu label="Save" onPrimaryClick={handleSave}>
        {(close) => (
          <>
            <ToolbarMenuItem
              onClick={() => {
                newResume()
                close()
              }}
            >
              New blank
            </ToolbarMenuItem>
            <ToolbarMenuItem onClick={() => handleSaveAsNew(close)}>
              Save as new…
            </ToolbarMenuItem>
          </>
        )}
      </ToolbarSplitMenu>
      <ToolbarMenu label="Load" align="right">
        {(close) =>
          savedResumes.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">
              No saved resumes yet
            </p>
          ) : (
            savedResumes.map((entry) => {
              const active = entry.id === activeSavedId
              return (
                <div
                  key={entry.id}
                  className="flex items-stretch border-b border-zinc-50 last:border-b-0"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleLoad(entry.id, close)}
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50 ${
                      active ? 'bg-zinc-50' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-900">
                      {entry.name}
                      {active ? ' · current' : ''}
                    </span>
                    <span className="shrink-0 text-[10px] text-zinc-500">
                      {formatUpdatedAt(entry.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.name}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${entry.name}”? This cannot be undone.`,
                        )
                      ) {
                        deleteSaved(entry.id)
                      }
                    }}
                    className="px-2.5 text-[11px] text-zinc-400 hover:bg-red-50 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )
            })
          )
        }
      </ToolbarMenu>
      {status ? (
        <span className="text-[11px] text-zinc-500">{status}</span>
      ) : null}
    </div>
  )
}
