import './style.css'
import type { CheckInMode, CheckInState } from './types'

// This is an initial app-shell scaffold: the UI wiring below is real, but the
// movement/GPS sensing, backend sync, and group chat are not implemented yet.
// See the "You OK" project spec doc for the full feature list and the
// open questions still to resolve.

const state: CheckInState = {
  mode: 'default',
  lastMovementAt: Date.now(),
  activeStop: null,
  status: 'ok'
}

const icons = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-3.5L6 7h12l2 5.5V16"/><path d="M4 16h16"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>`,
  mountain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 19 6-10 4 6 2-3 6 7Z"/></svg>`
}

const modes: { id: CheckInMode; label: string; icon: string }[] = [
  { id: 'default', label: 'Default', icon: icons.home },
  { id: 'travelling', label: 'Travelling', icon: icons.car },
  { id: 'hiking', label: 'Hiking', icon: icons.mountain }
]

let stopTickInterval: ReturnType<typeof setInterval> | null = null

function statusLabel(status: CheckInState['status']): string {
  switch (status) {
    case 'ok':
      return "You're OK"
    case 'concerned':
      return 'OK, but concerned'
    case 'not_ok':
      return 'Not OK — alert sent'
  }
}

function timeAgo(ms: number): string {
  const seconds = Math.round((Date.now() - ms) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return `${hours} hr ago`
}

/** Seconds remaining on the active planned stop, floored at 0. */
function stopSecondsRemaining(): number {
  if (!state.activeStop) return 0
  const totalMs = state.activeStop.durationMinutes * 60 * 1000
  const elapsedMs = Date.now() - state.activeStop.startedAt
  return Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000))
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function startStop(durationMinutes: 15 | 30) {
  state.activeStop = { startedAt: Date.now(), durationMinutes }
  render()
}

/** Manual stand-in for "movement started again" until real motion sensing is wired up. */
function endStop() {
  state.activeStop = null
  state.lastMovementAt = Date.now()
  render()
}

const RING_RADIUS = 38
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function render() {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  if (stopTickInterval) {
    clearInterval(stopTickInterval)
    stopTickInterval = null
  }

  const secondsRemaining = stopSecondsRemaining()
  if (state.activeStop && secondsRemaining === 0) {
    // Stop window ran out with no movement — falls back to the normal
    // no-movement flow (not implemented yet, so just clear it for now).
    state.activeStop = null
  }

  const fractionRemaining = state.activeStop
    ? secondsRemaining / (state.activeStop.durationMinutes * 60)
    : 1
  const dashOffset = RING_CIRCUMFERENCE * (1 - fractionRemaining)

  app.innerHTML = `
    <header class="app-header">
      <div class="icon-badge"><img src="/icons/icon-192.png" alt="" /></div>
      <div>
        <h1>You OK</h1>
        <p class="tagline">Friend-group safety check-ins</p>
      </div>
    </header>

    <section class="status-card ${state.status}">
      <div class="status-dot-wrap ${state.status}">
        <span class="ring"></span>
        <span class="dot"></span>
      </div>
      <div>
        <div class="status-label">Status</div>
        <div class="status-value">${statusLabel(state.status)}</div>
        <div class="status-time">Checked in ${timeAgo(state.lastMovementAt)}</div>
      </div>
    </section>

    <section>
      <p class="section-label">Mode</p>
      <div class="mode-row">
        ${modes
          .map(
            (m) => `
          <button class="mode-chip" data-mode="${m.id}" aria-pressed="${m.id === state.mode}">
            ${m.icon}
            <span>${m.label}</span>
          </button>`
          )
          .join('')}
      </div>
    </section>

    <section class="stop-card" ${state.mode === 'travelling' ? '' : 'hidden'}>
      <p class="section-label" style="margin-bottom: 14px;">Planned stop</p>
      ${
        state.activeStop
          ? `
        <div class="stop-timer">
          <div class="timer-ring-wrap">
            <svg viewBox="0 0 92 92">
              <circle class="timer-ring-track" cx="46" cy="46" r="${RING_RADIUS}" />
              <circle
                class="timer-ring-progress"
                cx="46" cy="46" r="${RING_RADIUS}"
                stroke-dasharray="${RING_CIRCUMFERENCE}"
                stroke-dashoffset="${dashOffset}"
              />
            </svg>
            <div class="timer-ring-value">${formatCountdown(secondsRemaining)}</div>
          </div>
          <div class="stop-timer-copy">
            <p class="stop-timer-title">No-movement check paused</p>
            <p class="stop-timer-subtitle">Resumes automatically when the timer ends, or as soon as you're moving again.</p>
          </div>
        </div>
        <button class="stop-end-btn" data-action="end-stop">I'm moving again</button>
      `
          : `
        <div class="stop-row">
          <button data-stop="15">15 min</button>
          <button data-stop="30">30 min</button>
        </div>
        <p class="note">Tag a rest, food, or petrol stop so it doesn’t trigger a false alert.</p>
      `
      }
    </section>

    <section class="actions">
      <button class="btn-concerned" data-status="concerned">
        <span>I'm OK, but concerned</span>
      </button>
      <button class="btn-not-ok" data-status="not_ok">
        <span>Not OK</span>
      </button>
    </section>

    <p class="footnote">
      Movement detection, live location, and the group check-in thread aren't wired up yet —
      this is the app shell to build those features into next.
    </p>
  `

  app.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode as CheckInMode
      if (state.mode !== 'travelling') state.activeStop = null
      render()
    })
  })

  app.querySelectorAll<HTMLButtonElement>('[data-stop]').forEach((btn) => {
    btn.addEventListener('click', () => {
      startStop(Number(btn.dataset.stop) as 15 | 30)
    })
  })

  const endStopBtn = app.querySelector<HTMLButtonElement>('[data-action="end-stop"]')
  endStopBtn?.addEventListener('click', endStop)

  app.querySelectorAll<HTMLButtonElement>('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // TODO: wire up to the backend once the Supabase project exists —
      // this should write a GroupUpdate with current coordinates and status.
      state.status = btn.dataset.status as CheckInState['status']
      state.lastMovementAt = Date.now()
      render()
    })
  })

  if (state.activeStop) {
    stopTickInterval = setInterval(render, 1000)
  }
}

render()

if ('serviceWorker' in navigator) {
  // Registered automatically by vite-plugin-pwa in the production build.
}
