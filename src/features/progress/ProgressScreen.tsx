import { LineChart } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { EmptyState } from '../../ui'

export function ProgressScreen() {
  return (
    <>
      <ScreenHeader title={en.progress.title} />
      <EmptyState icon={LineChart} title={en.progress.emptyTitle} body={en.progress.emptyBody} />
    </>
  )
}
