// Global filters ({days}; source and basis stay at their defaults) synced with the URL search param ?days=30.
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Filters } from '../api/types'

/** Period presets of the top-bar segmented control (`days` undefined = all time). */
export const PERIOD_PRESETS: { label: string; days: number | undefined }[] = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: undefined },
]

export const DEFAULT_FILTERS: Filters = { days: undefined, source: 'all', basis: 'all' }

/** Parses filters from search params, falling back to defaults on invalid values. */
export function parseFilters(sp: URLSearchParams): Filters {
  const d = Number(sp.get('days'))
  const days = Number.isInteger(d) && d >= 1 ? d : undefined
  // Source and group-location basis are not user-selectable: always the defaults.
  return { ...DEFAULT_FILTERS, days }
}

export interface UseFilters {
  filters: Filters
  setDays: (days: number | undefined) => void
  reset: () => void
  /** True when the period differs from the default. */
  isFiltered: boolean
}

/** Current filters + setters; other search params (e.g. ?region=) are preserved. */
export function useFilters(): UseFilters {
  const [sp, setSp] = useSearchParams()
  const days = sp.get('days')
  // Stable object identity while the param is unchanged (used in query keys and effects).
  const filters = useMemo(() => parseFilters(new URLSearchParams(days === null ? '' : { days })), [days])

  const setDays = useCallback(
    (value: number | undefined) =>
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set('days', String(value))
          else next.delete('days')
          return next
        },
        { replace: true },
      ),
    [setSp],
  )
  const reset = useCallback(() => setDays(undefined), [setDays])

  return { filters, setDays, reset, isFiltered: filters.days !== undefined }
}
