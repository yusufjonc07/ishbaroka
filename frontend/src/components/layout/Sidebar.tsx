// Left navigation: app name, the six pages, and a footer with live status, last update and data range.
import clsx from 'clsx'
import { Lock } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAccess, useHealth, useMeta } from '../../api/hooks'
import type { ListenerStatus } from '../../api/types'
import { useNow } from '../../hooks/useNow'
import { BOUNDARIES_CREDIT } from '../../lib/constants'
import { fmtDate, fmtInt, fmtRelative } from '../../lib/format'
import { useLinkTo } from '../../lib/links'
import { ROUTES } from '../../lib/routes'
import { useLive } from '../../state/live'
import { AccountBox } from '../auth/Auth'
import { statusText } from './LiveBadge'

export function Logo() {
  return <img src="/logo-horizontal.png" alt="Ishbaroka" className="h-10 w-auto shrink-0 object-contain" />
}

const LISTENER_LOOK: Record<ListenerStatus['state'], { dot: string; text: string }> = {
  listening: { dot: 'bg-emerald-500', text: 'Telegram: listening for new posts' },
  catching_up: { dot: 'bg-blue-500', text: 'Telegram: catching up on missed posts…' },
  connecting: { dot: 'bg-slate-400', text: 'Telegram: connecting…' },
  starting: { dot: 'bg-slate-400', text: 'Telegram: starting…' },
  restarting: { dot: 'bg-amber-500', text: 'Telegram: reconnecting…' },
  external: { dot: 'bg-slate-400', text: 'Telegram: a crawler is running separately' },
  login_required: { dot: 'bg-rose-500', text: 'Telegram: log in once with python -m src.main' },
  disabled: { dot: 'bg-slate-300', text: 'Telegram listener off' },
}

function ListenerLine({ status, now }: { status: ListenerStatus; now: number }) {
  const look = LISTENER_LOOK[status.state] ?? LISTENER_LOOK.disabled
  return (
    <div className="flex items-start gap-2 text-slate-700" title={status.managed ? 'Started by the API server' : undefined}>
      <span className={clsx('mt-1 size-2 shrink-0 rounded-full', look.dot)} aria-hidden />
      <span>
        {look.text}
        {status.state === 'catching_up' && (status.catch_up_read ?? 0) > 0 && (
          <span className="block text-slate-500">{fmtInt(status.catch_up_read ?? 0)} messages read</span>
        )}
        {status.groups && status.state === 'listening' && (
          <span
            className="block text-slate-500"
            title="Joined groups are pushed instantly; groups the account has not joined are checked in turn; private groups you are not in cannot be read."
          >
            {fmtInt(status.groups.live + status.groups.polled)} groups: {fmtInt(status.groups.live)} live, {fmtInt(status.groups.polled)} checked every ~2 min
            {status.groups.skipped > 0 && `, ${fmtInt(status.groups.skipped)} private skipped`}
          </span>
        )}
        {status.last_message_at && <span className="block text-slate-500">last post saved {fmtRelative(status.last_message_at, now)}</span>}
      </span>
    </div>
  )
}

/** Pages that show Telegram group details (locked until login). */
const PRIVATE_PATHS = new Set(['/groups'])

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const linkTo = useLinkTo()
  const live = useLive()
  const meta = useMeta()
  const health = useHealth()
  const access = useAccess()
  const now = useNow(5000)
  const dot = { live: 'bg-emerald-500', connecting: 'bg-slate-400', reconnecting: 'bg-amber-500', loading: 'bg-blue-500', offline: 'bg-rose-500' }[live.status]

  return (
    <nav aria-label="Main" className="glass flex h-full flex-col p-3">
      <div className="px-2 pt-1 pb-5">
        <Logo />
        <div className="mt-1.5 truncate text-xs text-slate-500">Ish e'lonlari · Korea — live job-ads dashboard</div>
      </div>
      <ul className="space-y-0.5">
        {ROUTES.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={linkTo(path)}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive ? 'bg-blue-600/10 text-blue-700' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {access === 'public' && PRIVATE_PATHS.has(path) && <Lock className="ml-auto size-3.5 text-slate-400" aria-label="needs login" />}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto px-1 pb-3">
        <AccountBox />
      </div>
      <div className="space-y-2 border-t border-slate-900/[0.06] px-2 pt-3 text-xs text-slate-500">
        <div className="flex items-start gap-2 text-slate-700">
          <span className={clsx('mt-1 size-2 shrink-0 rounded-full', dot)} aria-hidden />
          <span>{statusText(live.status)}</span>
        </div>
        {health.data?.listener && <ListenerLine status={health.data.listener} now={now} />}
        <div>Updated {live.lastUpdateAt ? fmtRelative(live.lastUpdateAt, now) : '—'}</div>
        {meta.data && (
          <div>
            Posts {fmtDate(meta.data.date_min, 'month')} – {fmtDate(meta.data.date_max, 'date')}
            <br />
            {fmtInt(meta.data.groups)} Telegram groups
          </div>
        )}
        <div className="text-slate-400">{BOUNDARIES_CREDIT}</div>
      </div>
    </nav>
  )
}
