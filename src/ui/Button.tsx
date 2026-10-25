import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { buttonClass, type ButtonSize, type ButtonVariant } from './styles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined
  size?: ButtonSize | undefined
  block?: boolean | undefined
  icon?: ReactNode
}

export function Button({
  variant,
  size,
  block,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant ?? 'primary'}
      className={cx(buttonClass({ variant, size, block }), className)}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}
