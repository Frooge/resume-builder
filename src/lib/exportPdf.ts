import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume'
  )
}

async function pageToPng(page: HTMLElement): Promise<string> {
  return toPng(page, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  })
}

export async function exportPdf(
  container: HTMLElement,
  fileName: string,
): Promise<void> {
  const pages = [
    ...container.querySelectorAll<HTMLElement>('[data-resume-page]'),
  ]

  if (pages.length === 0) {
    throw new Error('No resume pages found to export')
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  for (let i = 0; i < pages.length; i++) {
    const dataUrl = await pageToPng(pages[i])
    if (i > 0) pdf.addPage()
    pdf.addImage(dataUrl, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
  }

  pdf.save(`${slugify(fileName)}.pdf`)
}
