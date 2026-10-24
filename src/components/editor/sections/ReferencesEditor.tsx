import { useResumeStore } from '../../../store/resumeStore'
import { Field } from '../fields'

export function ReferencesEditor() {
  const references = useResumeStore((s) => s.resume.references)
  const onRequest = useResumeStore((s) => s.resume.referencesOnRequest)
  const addReference = useResumeStore((s) => s.addReference)
  const updateReference = useResumeStore((s) => s.updateReference)
  const removeReference = useResumeStore((s) => s.removeReference)
  const setReferencesOnRequest = useResumeStore(
    (s) => s.setReferencesOnRequest,
  )

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={onRequest}
            onChange={(e) => setReferencesOnRequest(e.target.checked)}
          />
          <span>Show “References available upon request” instead</span>
        </label>
        {onRequest && references.length > 0 ? (
          <p className="text-xs text-zinc-500">
            The references below are kept but hidden from the resume.
          </p>
        ) : null}
      </div>

      {references.length === 0 ? (
        <p className="text-xs text-zinc-500">No references yet.</p>
      ) : null}

      {references.map((entry, index) => (
        <div
          key={entry.id}
          className="space-y-2.5 rounded border border-zinc-200 bg-zinc-50/80 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">
              Reference {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeReference(entry.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
          <Field
            label="Name"
            value={entry.name}
            onChange={(name) => updateReference(entry.id, { name })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Job title"
              value={entry.title}
              onChange={(title) => updateReference(entry.id, { title })}
            />
            <Field
              label="Company"
              value={entry.company}
              onChange={(company) => updateReference(entry.id, { company })}
            />
          </div>
          <Field
            label="Relationship"
            value={entry.relationship}
            placeholder="Former manager at Brightline"
            onChange={(relationship) =>
              updateReference(entry.id, { relationship })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Phone"
              type="tel"
              value={entry.phone}
              onChange={(phone) => updateReference(entry.id, { phone })}
            />
            <Field
              label="Email"
              type="email"
              value={entry.email}
              onChange={(email) => updateReference(entry.id, { email })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addReference}
        className="w-full rounded border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Add reference
      </button>
    </div>
  )
}
