import { useResumeStore } from '../../../store/resumeStore'
import { TextArea } from '../fields'

export function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume.summary)
  const setSummary = useResumeStore((s) => s.setSummary)

  return (
    <TextArea
      label="Professional summary"
      value={summary}
      onChange={setSummary}
      placeholder="A short overview of your background and strengths."
      rows={5}
    />
  )
}
