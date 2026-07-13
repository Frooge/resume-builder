import { useMemo } from 'react'
import { useResumeStore } from '../../../store/resumeStore'
import { sortExperience } from '../../../lib/sortEntries'
import { Field, MonthYearField, TextArea } from '../fields'

export function ExperienceEditor() {
  const experience = useResumeStore((s) => s.resume.experience)
  const sorted = useMemo(() => sortExperience(experience), [experience])
  const addExperience = useResumeStore((s) => s.addExperience)
  const updateExperience = useResumeStore((s) => s.updateExperience)
  const removeExperience = useResumeStore((s) => s.removeExperience)

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-500">No experience entries yet.</p>
      ) : null}

      {sorted.map((entry, index) => (
        <div
          key={entry.id}
          className="space-y-2.5 rounded border border-zinc-200 bg-zinc-50/80 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">
              Role {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeExperience(entry.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
          <Field
            label="Role"
            value={entry.role}
            onChange={(role) => updateExperience(entry.id, { role })}
          />
          <Field
            label="Company"
            value={entry.company}
            onChange={(company) => updateExperience(entry.id, { company })}
          />
          <Field
            label="Location"
            value={entry.location}
            onChange={(location) => updateExperience(entry.id, { location })}
          />
          <div className="grid grid-cols-2 gap-2">
            <MonthYearField
              label="Start"
              value={entry.startDate}
              onChange={(startDate) =>
                updateExperience(entry.id, { startDate })
              }
            />
            <MonthYearField
              label="End"
              value={entry.current ? '' : entry.endDate}
              disabled={entry.current}
              placeholder={entry.current ? 'Present' : 'YYYY-MM'}
              onChange={(endDate) =>
                updateExperience(entry.id, { endDate })
              }
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={entry.current}
              onChange={(e) =>
                updateExperience(entry.id, {
                  current: e.target.checked,
                  endDate: e.target.checked ? '' : entry.endDate,
                })
              }
            />
            <span>Currently work here</span>
          </div>
          <TextArea
            label="Bullets (one per line)"
            value={entry.bullets.join('\n')}
            onChange={(value) =>
              updateExperience(entry.id, {
                bullets: value.split('\n'),
              })
            }
            rows={4}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addExperience}
        className="w-full rounded border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Add experience
      </button>
    </div>
  )
}
