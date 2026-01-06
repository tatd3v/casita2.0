import type { FeedingRecord, FeedingSlot, FeedingState, FeedingStatus } from './types'

const STATE_KEY = 'cat-feeding-state'
const HISTORY_KEY = 'cat-feeding-history'
const HISTORY_LIMIT = 50

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

const todayId = () => new Date().toISOString().slice(0, 10)

const getResetHour = () => 8 // 8 AM reset time

const shouldReset = (stateDate: string): boolean => {
  const today = new Date()
  const storedDate = new Date(stateDate)
  
  // Check if it's a different day
  if (stateDate !== todayId()) {
    // If it's a new day, check if we've passed the reset hour
    const currentHour = today.getHours()
    return currentHour >= getResetHour()
  }
  
  // Same day, no reset needed
  return false
}

const baseSlots = (): Record<FeedingSlot, FeedingStatus> => ({
  morning: { slot: 'morning', done: false },
  evening: { slot: 'evening', done: false },
})

export const blankState = (): FeedingState => ({
  date: todayId(),
  slots: baseSlots(),
})

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const loadState = (): FeedingState => {
  if (!isBrowser) return blankState()
  const state = safeParse<FeedingState>(localStorage.getItem(STATE_KEY), blankState())
  if (shouldReset(state.date)) {
    // Before resetting, preserve today's records in history
    preserveTodayRecords(state)
    return blankState()
  }
  return {
    ...state,
    slots: {
      morning: state.slots?.morning ?? { slot: 'morning', done: false },
      evening: state.slots?.evening ?? { slot: 'evening', done: false },
    },
  }
}

const preserveTodayRecords = (state: FeedingState) => {
  if (!isBrowser) return
  
  const history = loadHistory()
  const today = todayId()
  
  // Add today's completed slots to history before reset
  Object.entries(state.slots).forEach(([slot, status]) => {
    if (status.done && status.caretaker && status.timestamp) {
      const record: FeedingRecord = {
        slot: slot as FeedingSlot,
        caretaker: status.caretaker,
        date: state.date,
        timestamp: status.timestamp,
      }
      
      // Only add if not already in history
      const exists = history.some(h => 
        h.slot === record.slot && h.date === record.date && h.timestamp === record.timestamp
      )
      
      if (!exists) {
        addHistoryRecord(record, history)
      }
    }
  })
}

export const saveState = (state: FeedingState) => {
  if (!isBrowser) return
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export const loadHistory = (): FeedingRecord[] => {
  if (!isBrowser) return []
  return safeParse<FeedingRecord[]>(localStorage.getItem(HISTORY_KEY), [])
}

const persistHistory = (records: FeedingRecord[]) => {
  if (!isBrowser) return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, HISTORY_LIMIT)))
}

export const addHistoryRecord = (record: FeedingRecord, records: FeedingRecord[]) => {
  const next = [record, ...records].slice(0, HISTORY_LIMIT)
  persistHistory(next)
  return next
}

export const removeHistoryRecord = (slot: FeedingSlot, date: string, records: FeedingRecord[]) => {
  const index = records.findIndex((entry) => entry.slot === slot && entry.date === date)
  if (index === -1) return records
  const next = [...records.slice(0, index), ...records.slice(index + 1)]
  persistHistory(next)
  return next
}

export const manualReset = (): FeedingState => {
  const newState = blankState()
  saveState(newState)
  return newState
}
