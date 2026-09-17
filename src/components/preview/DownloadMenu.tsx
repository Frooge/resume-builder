import { useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { exportDocx } from '../../lib/exportDocx'
import { exportJson } from '../../lib/exportJson'
import { exportPdf } from '../../lib/exportPdf'
import { ToolbarMenu, ToolbarMenuItem, ToolbarMenuSeparator } from './ToolbarMenu'

export function DownloadMenu() {
  const resume = useResumeStore((s) => s.resume)
  const style = useResumeStore((s) => s.style)
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'json' | null>(
    null,
  )

  const handlePdf = async (close: () => void) => {
    close()
    setExporting('pdf')
    try {
      const name = resume.contact.fullName || 'resume'
      await exportPdf(resume, name, style)
    } finally {
      setExporting(null)
    }
  }

  const handleDocx = async (close: () => void) => {
    close()
    setExporting('docx')
    try {
      const name = resume.contact.fullName || 'resume'
      await exportDocx(resume, name, style)
    } finally {
      setExporting(null)
    }
  }

  const handleJson = async (close: () => void) => {
    close()
    setExporting('json')
    try {
      const name = resume.contact.fullName || 'resume'
      await exportJson(resume, name, style)
    } finally {
      setExporting(null)
    }
  }

  const label =
    exporting === 'pdf'
      ? 'Exporting PDF…'
      : exporting === 'docx'
        ? 'Exporting DOCX…'
        : exporting === 'json'
          ? 'Exporting JSON…'
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
          <ToolbarMenuItem onClick={() => void handlePdf(close)}>
            Download PDF
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => void handleDocx(close)}>
            Download DOCX
          </ToolbarMenuItem>
          <ToolbarMenuSeparator />
          <ToolbarMenuItem onClick={() => void handleJson(close)}>
            Download JSON
          </ToolbarMenuItem>
        </>
      )}
    </ToolbarMenu>
  )
}
