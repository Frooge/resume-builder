import { useResumeStore } from '../../../store/resumeStore'
import { Field } from '../fields'

export function ContactEditor() {
  const contact = useResumeStore((s) => s.resume.contact)
  const setContact = useResumeStore((s) => s.setContact)

  return (
    <div className="grid gap-2.5">
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
      <Field
        label="Website"
        value={contact.website}
        onChange={(website) => setContact({ website })}
      />
      <Field
        label="LinkedIn"
        value={contact.linkedin}
        onChange={(linkedin) => setContact({ linkedin })}
      />
    </div>
  )
}
