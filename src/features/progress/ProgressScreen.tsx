import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { WeightCard } from './WeightCard'

export function ProgressScreen() {
  return (
    <>
      <ScreenHeader title={en.progress.title} />
      <div className="flex flex-col gap-4 pt-2">
        <WeightCard />
      </div>
    </>
  )
}
