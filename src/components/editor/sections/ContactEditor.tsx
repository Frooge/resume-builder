import { useRef, useState } from 'react'
import { readPhotoFile } from '../../../lib/photo'
import { useResumeStore } from '../../../store/resumeStore'
import { displayLinkedIn, displayWebsite } from '../../../lib/contactLinks'
import { Field } from '../fields'

function PhotoField() {
  const photo = useResumeStore((s) => s.resume.contact.photo)
  const setContact = useResumeStore((s) => s.setContact)
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setContact({ photo: await readPhotoFile(file) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load image.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-zinc-500">
        Photo (optional)
      </span>
      <div className="flex items-center gap-3">
        {photo ? (
          <img
            src={photo}
            alt="Profile"
            className="h-12 w-12 shrink-0 border border-zinc-300 object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="h-12 w-12 shrink-0 border border-dashed border-zinc-300 bg-zinc-50"
          />
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:text-zinc-400"
        >
          {busy ? 'Loading…' : photo ? 'Change' : 'Upload photo'}
        </button>
        {photo ? (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setContact({ photo: undefined })
            }}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Remove
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export function ContactEditor() {
  const contact = useResumeStore((s) => s.resume.contact)
  const setContact = useResumeStore((s) => s.setContact)

  return (
    <div className="grid gap-2.5">
      <PhotoField />
      <Field
        label="Full name"
        value={contact.fullName}
        onChange={(fullName) => setContact({ fullName })}
        placeholder="Alex Rivera"
      />
      <Field
        label="Title"
        value={contact.title}
        onChange={(title) => setContact({ title })}
        placeholder="Software Engineer"
      />
      <Field
        label="Email"
        value={contact.email}
        onChange={(email) => setContact({ email })}
        type="email"
      />
      <Field
        label="Phone"
        value={contact.phone}
        onChange={(phone) => setContact({ phone })}
      />
      <Field
        label="Location"
        value={contact.location}
        onChange={(location) => setContact({ location })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="LinkedIn URL"
          value={contact.linkedin}
          onChange={(linkedin) => setContact({ linkedin })}
          placeholder="linkedin.com/in/you"
        />
        <Field
          label="Display text"
          value={contact.linkedinLabel}
          onChange={(linkedinLabel) => setContact({ linkedinLabel })}
          placeholder={displayLinkedIn(contact.linkedin) || 'in/you'}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Website URL"
          value={contact.website}
          onChange={(website) => setContact({ website })}
          placeholder="yoursite.dev"
        />
        <Field
          label="Display text"
          value={contact.websiteLabel}
          onChange={(websiteLabel) => setContact({ websiteLabel })}
          placeholder={displayWebsite(contact.website) || 'yoursite.dev'}
        />
      </div>
    </div>
  )
}
