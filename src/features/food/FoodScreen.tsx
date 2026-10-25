import { Utensils } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { EmptyState } from '../../ui'

export function FoodScreen() {
  return (
    <>
      <ScreenHeader title={en.food.title} />
      <EmptyState icon={Utensils} title={en.food.emptyTitle} body={en.food.emptyBody} />
    </>
  )
}
