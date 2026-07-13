import { useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { exportDocx } from '../../lib/exportDocx'
import { exportPdf } from '../../lib/exportPdf'
import { ToolbarMenu, ToolbarMenuItem } from './ToolbarMenu'

export function DownloadMenu() {
  const resume = useResumeStore((s) => s.resume)
  const style = useResumeStore((s) => s.style)
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null)

  const handlePdf = async (close: () => void) => {
    const el = document.getElementById('resume-document')
    if (!el) return
    close()
    setExporting('pdf')
    el.dataset.exporting = 'true'
    try {
      const name = resume.contact.fullName || 'resume'
      await exportPdf(el, name)
    } finally {
      delete el.dataset.exporting
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

  const label =
    exporting === 'pdf'
      ? 'Exporting PDF…'
      : exporting === 'docx'
        ? 'Exporting DOCX…'
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
        </>
      )}
    </ToolbarMenu>
  )
}
