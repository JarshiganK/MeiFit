import { Swords } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { EmptyState } from '../../ui'
import { SleepCard } from './SleepCard'

export function StatusScreen() {
  return (
    <>
      <ScreenHeader title={en.status.title} />
      <div className="flex flex-col gap-4 pt-2">
        <SleepCard />
        <EmptyState icon={Swords} title={en.status.emptyTitle} body={en.status.emptyBody} />
      </div>
    </>
  )
}
