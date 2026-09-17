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

const modes: { id: CheckInMode; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'travelling', label: 'Travelling' },
  { id: 'hiking', label: 'Hiking' }
]

let stopTickInterval: ReturnType<typeof setInterval> | null = null

function statusLabel(status: CheckInState['status']): string {
  switch (status) {
    case 'ok':
      return "You're OK"
    case 'concerned':
      return "OK, but concerned"
    case 'not_ok':
      return 'Not OK — alert sent'
  }
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
  render()
}

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

  app.innerHTML = `
    <header class="app-header">
      <img src="/icons/icon-192.png" alt="" />
      <h1>You OK</h1>
    </header>

    <section class="status-card">
      <span class="status-label">Status</span>
      <span class="status-value">${statusLabel(state.status)}</span>
    </section>

    <section>
      <div class="status-label" style="margin-bottom: 8px;">Mode</div>
      <div class="mode-row">
        ${modes
          .map(
            (m) => `
          <button class="mode-chip" data-mode="${m.id}" aria-pressed="${m.id === state.mode}">
            ${m.label}
          </button>`
          )
          .join('')}
      </div>
    </section>

    <section ${state.mode === 'travelling' ? '' : 'hidden'}>
      <div class="status-label" style="margin-bottom: 8px;">Planned stop</div>
      ${
        state.activeStop
          ? `
        <div class="stop-timer">
          <span class="stop-timer-value">${formatCountdown(secondsRemaining)}</span>
          <span class="stop-timer-label">remaining — no-movement check is paused</span>
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
      <button class="btn-concerned" data-status="concerned">I'm OK, but concerned</button>
      <button class="btn-not-ok" data-status="not_ok">Not OK</button>
    </section>

    <p class="note">
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
