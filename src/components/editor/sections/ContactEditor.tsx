import { useResumeStore } from '../../../store/resumeStore'
import { displayLinkedIn, displayWebsite } from '../../../lib/contactLinks'
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
