import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { iconButtonClass } from './styles'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name; icon buttons have no visible text. */
  label: string
  icon: ReactNode
  tone?: 'plain' | 'raised' | undefined
}

export function IconButton({
  label,
  icon,
  tone,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(iconButtonClass(tone), className)}
      {...rest}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
    </button>
  )
}
