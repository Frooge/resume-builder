import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createEmptyResume, createId, sampleResume } from '../lib/sampleResume'
import { DEFAULT_RESUME_STYLE } from '../lib/typography'
import type {
  Contact,
  EducationEntry,
  ExperienceEntry,
  ResumeData,
  ResumeStyle,
  SavedResume,
  SectionId,
} from '../types/resume'

interface UiState {
  openSections: SectionId[]
  focusSectionRequest: SectionId | null
}

interface ResumeStore {
  resume: ResumeData
  style: ResumeStyle
  savedResumes: SavedResume[]
  activeSavedId: string | null
  ui: UiState
  setContact: (contact: Partial<Contact>) => void
  setSummary: (summary: string) => void
  setSkills: (skills: string[]) => void
  setStyle: (patch: Partial<ResumeStyle>) => void
  addExperience: () => void
  updateExperience: (id: string, patch: Partial<ExperienceEntry>) => void
  removeExperience: (id: string) => void
  addEducation: () => void
  updateEducation: (id: string, patch: Partial<EducationEntry>) => void
  removeEducation: (id: string) => void
  reorderSections: (order: SectionId[]) => void
  toggleSection: (id: SectionId) => void
  openSection: (id: SectionId) => void
  requestFocusSection: (id: SectionId) => void
  clearFocusSectionRequest: () => void
  resetToSample: () => void
  newResume: () => void
  saveCurrent: (name: string) => string
  saveAsNew: (name: string) => string
  loadSaved: (id: string) => void
  deleteSaved: (id: string) => void
  renameSaved: (id: string, name: string) => void
}

const emptyExperience = (): ExperienceEntry => ({
  id: createId('exp'),
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  bullets: [''],
})

const emptyEducation = (): EducationEntry => ({
  id: createId('edu'),
  school: '',
  degree: '',
  location: '',
  startDate: '',
  endDate: '',
  details: '',
})

function snapshotName(resume: ResumeData, fallback: string): string {
  const trimmed = fallback.trim()
  if (trimmed) return trimmed
  return resume.contact.fullName.trim() || 'Untitled resume'
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resume: sampleResume,
      style: { ...DEFAULT_RESUME_STYLE },
      savedResumes: [],
      activeSavedId: null,
      ui: {
        openSections: ['contact'],
        focusSectionRequest: null,
      },

      setContact: (contact) =>
        set((state) => ({
          resume: {
            ...state.resume,
            contact: { ...state.resume.contact, ...contact },
          },
        })),

      setSummary: (summary) =>
        set((state) => ({
          resume: { ...state.resume, summary },
        })),

      setSkills: (skills) =>
        set((state) => ({
          resume: { ...state.resume, skills },
        })),

      setStyle: (patch) =>
        set((state) => ({
          style: { ...state.style, ...patch },
        })),

      addExperience: () =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: [...state.resume.experience, emptyExperience()],
          },
        })),

      updateExperience: (id, patch) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((entry) =>
              entry.id === id ? { ...entry, ...patch } : entry,
            ),
          },
        })),

      removeExperience: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.filter((e) => e.id !== id),
          },
        })),

      addEducation: () =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: [...state.resume.education, emptyEducation()],
          },
        })),

      updateEducation: (id, patch) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.map((entry) =>
              entry.id === id ? { ...entry, ...patch } : entry,
            ),
          },
        })),

      removeEducation: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.filter((e) => e.id !== id),
          },
        })),

      reorderSections: (order) =>
        set((state) => ({
          resume: { ...state.resume, sectionOrder: order },
        })),

      toggleSection: (id) =>
        set((state) => {
          const open = state.ui.openSections.includes(id)
          return {
            ui: {
              ...state.ui,
              openSections: open
                ? state.ui.openSections.filter((s) => s !== id)
                : [...state.ui.openSections, id],
            },
          }
        }),

      openSection: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            openSections: state.ui.openSections.includes(id)
              ? state.ui.openSections
              : [...state.ui.openSections, id],
          },
        })),

      requestFocusSection: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            openSections: state.ui.openSections.includes(id)
              ? state.ui.openSections
              : [...state.ui.openSections, id],
            focusSectionRequest: id,
          },
        })),

      clearFocusSectionRequest: () =>
        set((state) => ({
          ui: { ...state.ui, focusSectionRequest: null },
        })),

      resetToSample: () =>
        set({
          resume: structuredClone(sampleResume),
          style: { ...DEFAULT_RESUME_STYLE },
          activeSavedId: null,
          ui: {
            openSections: ['contact'],
            focusSectionRequest: null,
          },
        }),

      newResume: () =>
        set({
          resume: createEmptyResume(),
          style: { ...DEFAULT_RESUME_STYLE },
          activeSavedId: null,
          ui: {
            openSections: ['contact'],
            focusSectionRequest: null,
          },
        }),

      saveCurrent: (name) => {
        const state = get()
        const resolvedName = snapshotName(state.resume, name)
        const now = new Date().toISOString()
        const resume = structuredClone(state.resume)
        const style = structuredClone(state.style)

        if (state.activeSavedId) {
          const exists = state.savedResumes.some(
            (s) => s.id === state.activeSavedId,
          )
          if (exists) {
            set({
              savedResumes: state.savedResumes.map((s) =>
                s.id === state.activeSavedId
                  ? { ...s, name: resolvedName, updatedAt: now, resume, style }
                  : s,
              ),
            })
            return state.activeSavedId
          }
        }

        const id = createId('saved')
        const entry: SavedResume = {
          id,
          name: resolvedName,
          updatedAt: now,
          resume,
          style,
        }
        set({
          savedResumes: [entry, ...state.savedResumes],
          activeSavedId: id,
        })
        return id
      },

      saveAsNew: (name) => {
        const state = get()
        const id = createId('saved')
        const entry: SavedResume = {
          id,
          name: snapshotName(state.resume, name),
          updatedAt: new Date().toISOString(),
          resume: structuredClone(state.resume),
          style: structuredClone(state.style),
        }
        set({
          savedResumes: [entry, ...state.savedResumes],
          activeSavedId: id,
        })
        return id
      },

      loadSaved: (id) => {
        const entry = get().savedResumes.find((s) => s.id === id)
        if (!entry) return
        set({
          resume: structuredClone(entry.resume),
          style: structuredClone(entry.style),
          activeSavedId: entry.id,
          ui: {
            ...get().ui,
            openSections: ['contact'],
            focusSectionRequest: null,
          },
        })
      },

      deleteSaved: (id) =>
        set((state) => ({
          savedResumes: state.savedResumes.filter((s) => s.id !== id),
          activeSavedId:
            state.activeSavedId === id ? null : state.activeSavedId,
        })),

      renameSaved: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => ({
          savedResumes: state.savedResumes.map((s) =>
            s.id === id ? { ...s, name: trimmed } : s,
          ),
        }))
      },
    }),
    {
      name: 'resume-builder',
      partialize: (state) => ({
        resume: state.resume,
        style: state.style,
        savedResumes: state.savedResumes,
        activeSavedId: state.activeSavedId,
      }),
    },
  ),
)
