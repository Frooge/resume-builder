import type { Contact } from '../types/resume'

export type ContactItemKey = 'location' | 'email' | 'phone' | 'linkedin' | 'website'

export interface ContactItem {
  key: ContactItemKey
  text: string
  href?: string
}

/** Only http(s) URLs pass through as-is; anything else is treated as a bare host, which also keeps `javascript:` and similar schemes out of hrefs. */
const HTTP_URL = /^https?:\/\//i

export function websiteHref(url: string): string {
  const value = url.trim()
  if (!value) return ''
  return HTTP_URL.test(value) ? value : `https://${value}`
}

/** Accepts a full URL, `linkedin.com/in/x`, `in/x`, or a bare handle. */
export function linkedinHref(url: string): string {
  const value = url.trim()
  if (!value) return ''
  if (HTTP_URL.test(value)) return value
  if (/linkedin\.com/i.test(value)) return `https://${value}`
  const handle = value.replace(/^\/?(in\/)?@?/, '')
  return `https://www.linkedin.com/in/${handle}`
}

export function mailtoHref(email: string): string {
  return `mailto:${email.trim()}`
}

export function displayLinkedIn(url: string): string {
  return url
    .trim()
    .replace(HTTP_URL, '')
    .replace(/^(www\.)?linkedin\.com\//i, '')
    .replace(/\/$/, '')
}

export function displayWebsite(url: string): string {
  return url.trim().replace(HTTP_URL, '').replace(/\/$/, '')
}

/** The contact line's items, in display order. The single source for every renderer. */
export function contactLinks(contact: Contact): ContactItem[] {
  const items: ContactItem[] = []
  if (contact.location.trim()) {
    items.push({ key: 'location', text: contact.location.trim() })
  }
  if (contact.email.trim()) {
    items.push({
      key: 'email',
      text: contact.email.trim(),
      href: mailtoHref(contact.email),
    })
  }
  if (contact.phone.trim()) {
    items.push({ key: 'phone', text: contact.phone.trim() })
  }
  if (contact.linkedin.trim()) {
    items.push({
      key: 'linkedin',
      text: contact.linkedinLabel.trim() || displayLinkedIn(contact.linkedin),
      href: linkedinHref(contact.linkedin),
    })
  }
  if (contact.website.trim()) {
    items.push({
      key: 'website',
      text: contact.websiteLabel.trim() || displayWebsite(contact.website),
      href: websiteHref(contact.website),
    })
  }
  return items
}
