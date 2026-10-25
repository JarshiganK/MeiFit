import { BookOpen, Dumbbell, HeartPulse, type LucideIcon } from 'lucide-react'
import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent shadow-glow',
  secondary: 'bg-raised text-text border border-border',
  ghost: 'bg-transparent text-text',
  danger: 'bg-error text-on-error',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-13 px-5 text-lg',
}

/** Shared look for buttons and button-styled links. */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
}: {
  variant?: ButtonVariant | undefined
  size?: ButtonSize | undefined
  block?: boolean | undefined
} = {}): string {
  return cx(
    'inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold',
    'transition-transform duration-(--dur-fast) ease-out active:scale-95',
    'disabled:pointer-events-none disabled:opacity-50',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    block && 'w-full',
  )
}

/** Shared look for 44 × 44 icon buttons and icon links. */
export function iconButtonClass(tone: 'plain' | 'raised' | undefined = 'plain'): string {
  return cx(
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text',
    'transition-transform duration-(--dur-fast) ease-out active:scale-90',
    'disabled:pointer-events-none disabled:opacity-50',
    tone === 'raised' && 'border border-border bg-raised',
  )
}

export type Stat = 'str' | 'vit' | 'int'

/** One hue and one icon per stat, used the same way everywhere (never colour alone). */
export const STAT_STYLE: Record<Stat, { icon: LucideIcon; text: string; bg: string }> = {
  str: { icon: Dumbbell, text: 'text-str', bg: 'bg-str' },
  vit: { icon: HeartPulse, text: 'text-vit', bg: 'bg-vit' },
  int: { icon: BookOpen, text: 'text-int', bg: 'bg-int' },
}

function decimalsOf(step: number): number {
  return String(step).split('.')[1]?.length ?? 0
}

/** Snaps a typed number to the nearest step and keeps it within min–max. */
export function clampToStep(value: number, min: number, max: number, step: number): number {
  const snapped = Math.round((value - min) / step) * step + min
  const clamped = Math.min(max, Math.max(min, snapped))
  return Number(clamped.toFixed(decimalsOf(step)))
}
