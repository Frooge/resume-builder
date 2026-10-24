import { useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { exportDocx } from '../../lib/exportDocx'
import { exportJson } from '../../lib/exportJson'
import { exportPdf } from '../../lib/exportPdf'
import { toast } from '../../store/toastStore'
import { ToolbarMenu, ToolbarMenuItem, ToolbarMenuSeparator } from './ToolbarMenu'

const EXPORTERS = { pdf: exportPdf, docx: exportDocx, json: exportJson }
type ExportFormat = keyof typeof EXPORTERS

export function DownloadMenu() {
  const resume = useResumeStore((s) => s.resume)
  const style = useResumeStore((s) => s.style)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat, close: () => void) => {
    close()
    setExporting(format)
    const kind = format.toUpperCase()
    try {
      const name = resume.contact.fullName || 'resume'
      await EXPORTERS[format](resume, name, style)
      toast.success(`${kind} downloaded`)
    } catch (error) {
      console.error(error)
      toast.error(`Could not export ${kind}. Please try again.`)
    } finally {
      setExporting(null)
    }
  }

  const label = exporting
    ? `Exporting ${exporting.toUpperCase()}…`
    : 'Download'

  return (
    <ToolbarMenu
      label={label}
      disabled={exporting !== null}
      variant="primary"
      align="right"
    >
      {(close) => (
        <>
          <ToolbarMenuItem onClick={() => void handleExport('pdf', close)}>
            Download PDF
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => void handleExport('docx', close)}>
            Download DOCX
          </ToolbarMenuItem>
          <ToolbarMenuSeparator />
          <ToolbarMenuItem onClick={() => void handleExport('json', close)}>
            Download JSON
          </ToolbarMenuItem>
        </>
      )}
    </ToolbarMenu>
  )
}
