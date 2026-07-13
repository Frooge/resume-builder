import { useResumeStore } from '../../../store/resumeStore'
import { Field, MonthYearField, TextArea } from '../fields'

export function EducationEditor() {
  const education = useResumeStore((s) => s.resume.education)
  const addEducation = useResumeStore((s) => s.addEducation)
  const updateEducation = useResumeStore((s) => s.updateEducation)
  const removeEducation = useResumeStore((s) => s.removeEducation)

  return (
    <div className="space-y-4">
      {education.length === 0 ? (
        <p className="text-xs text-zinc-500">No education entries yet.</p>
      ) : null}

      {education.map((entry, index) => (
        <div
          key={entry.id}
          className="space-y-2.5 rounded border border-zinc-200 bg-zinc-50/80 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">
              School {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEducation(entry.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
          <Field
            label="School"
            value={entry.school}
            onChange={(school) => updateEducation(entry.id, { school })}
          />
          <Field
            label="Degree"
            value={entry.degree}
            onChange={(degree) => updateEducation(entry.id, { degree })}
          />
          <Field
            label="Location"
            value={entry.location}
            onChange={(location) => updateEducation(entry.id, { location })}
          />
          <div className="grid grid-cols-2 gap-2">
            <MonthYearField
              label="Start"
              value={entry.startDate}
              onChange={(startDate) =>
                updateEducation(entry.id, { startDate })
              }
            />
            <MonthYearField
              label="End"
              value={entry.endDate}
              onChange={(endDate) => updateEducation(entry.id, { endDate })}
            />
          </div>
          <TextArea
            label="Details"
            value={entry.details}
            onChange={(details) => updateEducation(entry.id, { details })}
            rows={2}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addEducation}
        className="w-full rounded border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Add education
      </button>
    </div>
  )
}
