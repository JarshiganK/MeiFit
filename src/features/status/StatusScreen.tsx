import { Swords } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { EmptyState } from '../../ui'

export function StatusScreen() {
  return (
    <>
      <ScreenHeader title={en.status.title} />
      <EmptyState icon={Swords} title={en.status.emptyTitle} body={en.status.emptyBody} />
    </>
  )
}
