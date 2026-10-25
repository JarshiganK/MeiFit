import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'
import { en } from '../copy/en'
import { EmptyState, buttonClass } from '../ui'

export function NotFound() {
  return (
    <>
      <h1 className="sr-only">{en.notFound.title}</h1>
      <EmptyState
        icon={MapPinOff}
        title={en.notFound.title}
        body={en.notFound.body}
        action={
          <Link to="/" className={buttonClass()}>
            {en.notFound.action}
          </Link>
        }
      />
    </>
  )
}
