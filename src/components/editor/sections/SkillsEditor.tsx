import { useResumeStore } from '../../../store/resumeStore'
import { TextArea } from '../fields'

export function SkillsEditor() {
  const skills = useResumeStore((s) => s.resume.skills)
  const setSkills = useResumeStore((s) => s.setSkills)

  return (
    <TextArea
      label="Skills (one category per line)"
      value={skills.join('\n')}
      onChange={(value) => setSkills(value.split('\n').map((s) => s.trimEnd()))}
      placeholder={'Frontend: TypeScript, React\nBackend: Node.js, PostgreSQL'}
      rows={6}
    />
  )
}
