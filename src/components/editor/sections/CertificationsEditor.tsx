import { useMemo } from 'react'
import { useResumeStore } from '../../../store/resumeStore'
import { sortCertifications } from '../../../lib/sortEntries'
import { Field, MonthYearField } from '../fields'

export function CertificationsEditor() {
  const certifications = useResumeStore((s) => s.resume.certifications)
  const sorted = useMemo(
    () => sortCertifications(certifications),
    [certifications],
  )
  const addCertification = useResumeStore((s) => s.addCertification)
  const updateCertification = useResumeStore((s) => s.updateCertification)
  const removeCertification = useResumeStore((s) => s.removeCertification)

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-500">No certifications yet.</p>
      ) : null}

      {sorted.map((entry, index) => (
        <div
          key={entry.id}
          className="space-y-2.5 rounded border border-zinc-200 bg-zinc-50/80 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">
              Certification {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCertification(entry.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
          <Field
            label="Name"
            value={entry.name}
            placeholder="AWS Certified Solutions Architect – Associate"
            onChange={(name) => updateCertification(entry.id, { name })}
          />
          <Field
            label="Issuer"
            value={entry.issuer}
            placeholder="Amazon Web Services"
            onChange={(issuer) => updateCertification(entry.id, { issuer })}
          />
          <MonthYearField
            label="Date (optional)"
            value={entry.date}
            onChange={(date) => updateCertification(entry.id, { date })}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addCertification}
        className="w-full rounded border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Add certification
      </button>
    </div>
  )
}
