export type FeedingSlot = 'morning' | 'evening'

export const CARETAKER_NAMES = [
  'Africa',
  'Dani',
  'Garnet', 
  'Leonyx',
  'Salem',
  'Siahh',
  'Tats',
  'Yose'
] as const

export type CaretakerName = typeof CARETAKER_NAMES[number]

export interface FeedingStatus {
  slot: FeedingSlot
  done: boolean
  caretaker?: string
  timestamp?: string
}

export interface FeedingState {
  date: string
  slots: Record<FeedingSlot, FeedingStatus>
}

export interface FeedingRecord {
  slot: FeedingSlot
  caretaker: string
  date: string
  timestamp: string
}

export type Locale = 'es' | 'en'

export interface FeedingCardCopy {
  slotLabels: Record<FeedingSlot, string>
  badge: { done: string; pending: string }
  description: {
    done: (caretaker: string) => string
    pending: string
    fallbackName: string
  }
  caretakerLabel: string
  placeholder: string
  otherOption: string
  ariaLabel: (slotLabel: string) => string
  button: { done: string; pending: string }
}

export interface HistoryCopy {
  title: string
  subtitleWithRecords: string
  subtitleEmpty: string
  emptyMessage: string
  slotLabels: Record<FeedingSlot, string>
}

export interface AppCopy {
  hero: {
    eyebrow: string
    title: string
    lead: string
  }
  general: {
    fallbackCaretaker: string
    languageName: string
    toggleLabel: string
    resetButton: string
  }
  card: FeedingCardCopy
  history: HistoryCopy
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      feeding_states: {
        Row: {
          id: string
          date: string
          slots: Record<FeedingSlot, FeedingStatus>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          slots: Record<FeedingSlot, FeedingStatus>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          slots?: Record<FeedingSlot, FeedingStatus>
          created_at?: string
          updated_at?: string
        }
      }
      feeding_history: {
        Row: {
          id: string
          slot: FeedingSlot
          caretaker: string
          date: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          slot: FeedingSlot
          caretaker: string
          date: string
          timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          slot?: FeedingSlot
          caretaker?: string
          date?: string
          timestamp?: string
          created_at?: string
        }
      }
    }
  }
}
