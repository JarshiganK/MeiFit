/**
 * The weight chart (plan §10): daily weigh-ins as dots and each week's average
 * as a line. Chart.js lives in this lazy chunk only, so it never slows the
 * initial load (CLAUDE.md §5).
 */
import {
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { useTheme } from '../../app/useTheme'
import { en } from '../../copy/en'
import type { WeekAverage, WeighIn } from '../../domain/body'
import { addDays, daysBetween, formatShortDate, weekStart } from '../../domain/date'

ChartJS.register(
  ScatterController,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler,
)

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export interface WeightChartProps {
  weighIns: WeighIn[]
  weeks: WeekAverage[]
}

export default function WeightChart({ weighIns, weeks }: WeightChartProps) {
  // Re-read the colour tokens whenever the theme changes.
  const { theme } = useTheme()
  const first = weighIns[0]?.date ?? weeks[0]?.weekStart
  if (!first) return null
  const x = (date: string) => daysBetween(first, date)
  const weekCentre = (start: string) => {
    const days = weighIns.filter((w) => weekStart(w.date) === start).map((w) => x(w.date))
    return days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : x(addDays(start, 3))
  }
  const colors = {
    dot: token('--color-muted'),
    line: token('--color-vit'),
    grid: token('--color-border'),
    text: token('--color-muted'),
  }

  const data: ChartData<'scatter'> = {
    datasets: [
      {
        type: 'scatter',
        label: en.weight.chartDaily,
        data: weighIns.map((w) => ({ x: x(w.date), y: w.weightKg })),
        backgroundColor: colors.dot,
        pointRadius: 3,
      },
      {
        // Plotted at the middle of the days it averages, so this week never reaches into the future.
        type: 'line' as 'scatter',
        label: en.weight.chartWeekly,
        data: weeks.map((w) => ({ x: weekCentre(w.weekStart), y: w.averageKg })),
        borderColor: colors.line,
        backgroundColor: colors.line,
        borderWidth: 3,
        pointRadius: 4,
        showLine: true,
        tension: 0.25,
      },
    ],
  }

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => formatShortDate(addDays(first, items[0]?.parsed.x ?? 0)),
          label: (item) => `${item.dataset.label ?? ''}: ${item.parsed.y} kg`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        grid: { color: colors.grid },
        ticks: {
          color: colors.text,
          maxTicksLimit: 5,
          callback: (value) => formatShortDate(addDays(first, Number(value))).slice(4),
        },
      },
      y: {
        grid: { color: colors.grid },
        ticks: { color: colors.text, callback: (value) => `${value} kg` },
      },
    },
  }

  return (
    <div className="h-56" data-theme-key={theme}>
      <Scatter data={data} options={options} aria-hidden="true" />
    </div>
  )
}
