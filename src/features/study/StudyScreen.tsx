import { Timer } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { EmptyState } from '../../ui'

export function StudyScreen() {
  return (
    <>
      <ScreenHeader title={en.study.title} />
      <EmptyState icon={Timer} title={en.study.emptyTitle} body={en.study.emptyBody} />
    </>
  )
}
