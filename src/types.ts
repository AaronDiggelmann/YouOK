// Core domain types for You OK, matching the feature spec in the project docs.
// These are placeholders to build against as each piece (movement sensing,
// backend sync, group chat) gets implemented.

export type CheckInMode = 'default' | 'travelling' | 'hiking'

export type AlertStatus = 'ok' | 'concerned' | 'not_ok'

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

/** A deliberate pause of the no-movement countdown in Travelling mode. */
export interface PlannedStop {
  startedAt: number
  durationMinutes: 15 | 30
}

export interface CheckInState {
  mode: CheckInMode
  lastMovementAt: number
  activeStop: PlannedStop | null
  status: AlertStatus
}

/** A single event posted into the shared group thread. */
export interface GroupUpdate {
  id: string
  memberId: string
  status: AlertStatus
  coordinates: Coordinates | null
  message?: string
  createdAt: number
}
