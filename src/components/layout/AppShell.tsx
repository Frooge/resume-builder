import { EditorPanel } from '../editor/EditorPanel'
import { PreviewPanel } from '../preview/PreviewPanel'

export function AppShell() {
  return (
    <div className="flex h-svh overflow-hidden bg-zinc-50 text-zinc-900">
      <EditorPanel />
      <PreviewPanel />
    </div>
  )
}
