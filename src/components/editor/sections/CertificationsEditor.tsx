import { useResumeStore } from '../../../store/resumeStore'
import { TextArea } from '../fields'

export function CertificationsEditor() {
  const certifications = useResumeStore((s) => s.resume.certifications)
  const setCertifications = useResumeStore((s) => s.setCertifications)

  return (
    <TextArea
      label="Certifications (one per line)"
      value={certifications.join('\n')}
      onChange={(value) => setCertifications(value.split('\n'))}
      placeholder={'AWS Certified Solutions Architect (2023)\nPMP (2021)'}
      rows={4}
    />
  )
}
