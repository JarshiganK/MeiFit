import { Dumbbell } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { EmptyState } from '../../ui'

export function TrainScreen() {
  return (
    <>
      <ScreenHeader title={en.train.title} />
      <EmptyState icon={Dumbbell} title={en.train.emptyTitle} body={en.train.emptyBody} />
    </>
  )
}
