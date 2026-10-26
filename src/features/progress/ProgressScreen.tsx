import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { useToday } from '../../app/useToday'
import { FitnessHistory } from '../fitness/FitnessHistory'
import { AchievementsCard } from './AchievementsCard'
import { RecordsCard } from './RecordsCard'
import { WeeklyReportCard } from './WeeklyReportCard'
import { WeightCard } from './WeightCard'

export function ProgressScreen() {
  const today = useToday()
  return (
    <>
      <ScreenHeader title={en.progress.title} />
      <div className="flex flex-col gap-4 pt-2">
        <WeeklyReportCard today={today} />
        <WeightCard />
        <FitnessHistory today={today} />
        <RecordsCard />
        <AchievementsCard today={today} />
      </div>
    </>
  )
}
