import type { ResumeData } from '../types/resume'
import { DEFAULT_SECTION_ORDER } from '../types/resume'

export const sampleResume: ResumeData = {
  contact: {
    fullName: 'Alex Rivera',
    title: 'Software Engineer',
    email: 'alex.rivera@email.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    website: 'alexrivera.dev',
    linkedin: 'linkedin.com/in/alexrivera',
  },
  summary:
    'Software engineer with 5+ years building reliable web products. Focused on clear architecture, thoughtful UX, and shipping iteratively with strong collaboration across product and design.',
  experience: [
    {
      id: 'exp-1',
      company: 'Northstar Labs',
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2022-03',
      endDate: '',
      current: true,
      bullets: [
        'Led redesign of the customer dashboard, improving task completion by 28%.',
        'Built shared React component library adopted by 4 product teams.',
        'Mentored 3 engineers and established code review guidelines.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Brightline',
      role: 'Software Engineer',
      location: 'Remote',
      startDate: '2019-06',
      endDate: '2022-02',
      current: false,
      bullets: [
        'Shipped end-to-end features for a B2B SaaS platform serving 200+ companies.',
        'Reduced API latency by 40% through query optimization and caching.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      location: 'Berkeley, CA',
      startDate: '2015-08',
      endDate: '2019-05',
      details: 'Relevant coursework: Algorithms, Databases, HCI',
    },
  ],
  skills: [
    'Frontend: TypeScript, React, Tailwind CSS',
    'Backend: Node.js, PostgreSQL, REST APIs',
    'Other: System Design, Technical Writing',
  ],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
}

export function createEmptyResume(): ResumeData {
  return {
    contact: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
