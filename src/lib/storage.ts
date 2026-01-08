import { supabase } from './supabase';
import type {
  FeedingRecord,
  FeedingSlot,
  FeedingState,
  FeedingStatus,
  Database,
} from './types';

const HISTORY_LIMIT = 50;

export const todayId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getResetHour = () => 7; // 7 AM reset time

const shouldReset = (stateDate: string): boolean => {
  const today = new Date();
  const storedDate = new Date(stateDate);

  // Check if it's a different day
  if (stateDate !== todayId()) {
    // If it's a new day, check if we've passed the reset hour
    const currentHour = today.getHours();
    return currentHour >= getResetHour();
  }

  // Same day, no reset needed
  return false;
};

const baseSlots = (): Record<FeedingSlot, FeedingStatus> => ({
  morning: { slot: 'morning', done: false },
  evening: { slot: 'evening', done: false },
});

export const blankState = (): FeedingState => ({
  date: todayId(),
  slots: baseSlots(),
});

// Load current feeding state from Supabase
export const loadState = async (): Promise<FeedingState> => {
  try {
    const today = todayId();

    // Load state from feeding_states table
    const { data, error } = await supabase
      .from('feeding_states')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error loading state:', error);
      return blankState();
    }

    // Load history records for today to sync state
    const { data: historyRecords } = await supabase
      .from('feeding_history')
      .select('*')
      .eq('date', today);

    let state: FeedingState;

    if (!data) {
      state = blankState();
    } else {
      state = {
        date: data.date,
        slots: {
          morning: data.slots?.morning ?? { slot: 'morning', done: false },
          evening: data.slots?.evening ?? { slot: 'evening', done: false },
        },
      };

      // Check if we need to reset
      if (shouldReset(state.date)) {
        await preserveTodayRecords(state);
        return blankState();
      }
    }

    // Sync state with history records - if history exists, mark as done
    if (historyRecords && historyRecords.length > 0) {
      historyRecords.forEach((record) => {
        const slotValue = Array.isArray(record.slot) ? record.slot[0] : record.slot;
        if (slotValue === 'morning' || slotValue === 'evening') {
          const slot = slotValue as FeedingSlot;
          state.slots[slot] = {
            slot: slot,
            done: true,
            caretaker: record.caretaker,
            timestamp: record.timestamp,
          };
        }
      });

      // Save the synced state back to database
      await saveState(state);
    }

    return state;
  } catch (error) {
    console.error('Error loading state:', error);
    return blankState();
  }
};

// Save feeding state to Supabase
export const saveState = async (state: FeedingState): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('feeding_states').upsert(
      {
        date: state.date,
        slots: state.slots,
        user_id: user?.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'date',
      },
    );

    if (error) {
      console.error('Error saving state:', error);
    }
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

// Load history from Supabase
export const loadHistory = async (): Promise<FeedingRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('feeding_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading history:', error);
      return [];
    }

    return data.map((record) => ({
      slot: record.slot,
      caretaker: record.caretaker,
      date: record.date,
      timestamp: record.timestamp,
    }));
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

// Add history record to Supabase
export const addHistoryRecord = async (
  record: FeedingRecord,
  currentHistory: FeedingRecord[],
): Promise<FeedingRecord[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('feeding_history').insert({
      slot: `{${record.slot}}`,
      caretaker: record.caretaker,
      date: record.date,
      timestamp: record.timestamp,
      user_id: user?.id,
    });

    if (error) {
      console.error('Error adding history record:', error);
    }

    // Return updated history
    return await loadHistory();
  } catch (error) {
    console.error('Error adding history record:', error);
    return currentHistory;
  }
};

// Remove history record from Supabase (only the most recent one for the slot)
export const removeHistoryRecord = async (
  slot: FeedingSlot,
  date: string,
  currentHistory: FeedingRecord[],
): Promise<FeedingRecord[]> => {
  try {
    // Fetch all records for the date and filter in JavaScript
    const { data: allRecords, error: fetchError } = await supabase
      .from('feeding_history')
      .select('*')
      .eq('date', date)
      .order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching history records:', fetchError);
      return currentHistory;
    }

    // Filter records that contain the slot in their array
    const matchingRecords =
      allRecords?.filter((record) => {
        // The slot field is an array, check if it contains our slot
        if (Array.isArray(record.slot)) {
          return record.slot.includes(slot);
        }
        // Fallback: check if slot equals the value directly (in case it's not an array)
        return record.slot === slot;
      }) || [];

    if (matchingRecords.length > 0) {
      const mostRecentRecord = matchingRecords[0];

      // Delete by timestamp (unique identifier)
      const { error: deleteError } = await supabase
        .from('feeding_history')
        .delete()
        .eq('timestamp', mostRecentRecord.timestamp);

      if (deleteError) {
        console.error('Error removing history record:', deleteError);
      }
    }

    // Return updated history
    return await loadHistory();
  } catch (error) {
    console.error('Error removing history record:', error);
    return currentHistory;
  }
};

// Preserve today's records in history before reset
const preserveTodayRecords = async (state: FeedingState): Promise<void> => {
  try {
    const today = todayId();

    // Add today's completed slots to history before reset
    for (const [slot, status] of Object.entries(state.slots)) {
      if (status.done && status.caretaker && status.timestamp) {
        const record: FeedingRecord = {
          slot: slot as FeedingSlot,
          caretaker: status.caretaker,
          date: state.date,
          timestamp: status.timestamp,
        };

        // Check if record already exists
        const { data: existing } = await supabase
          .from('feeding_history')
          .select('*')
          .eq('slot', record.slot)
          .eq('date', record.date)
          .eq('timestamp', record.timestamp)
          .single();

        if (!existing) {
          await addHistoryRecord(record, []);
        }
      }
    }
  } catch (error) {
    console.error('Error preserving today records:', error);
  }
};

// Manual reset function
export const manualReset = async (): Promise<FeedingState> => {
  const newState = blankState();
  await saveState(newState);
  return newState;
};

// Real-time subscription helpers
export const subscribeToStateChanges = (
  callback: (state: FeedingState) => void,
) => {
  const today = todayId();

  return supabase
    .channel('feeding_state_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feeding_states',
        filter: `date=eq.${today}`,
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newState = payload.new as any;
          callback({
            date: newState.date,
            slots: newState.slots,
          });
        }
      },
    )
    .subscribe();
};

export const subscribeToHistoryChanges = (
  callback: (history: FeedingRecord[]) => void,
) => {
  return supabase
    .channel('feeding_history_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feeding_history',
      },
      async () => {
        const updatedHistory = await loadHistory();
        callback(updatedHistory);
      },
    )
    .subscribe();
};

// Check user's rate limit status
export const getRateLimitStatus = async () => {
  try {
    const { data, error } = await supabase.rpc('get_user_rate_limit_status');

    if (error) {
      console.error('Error checking rate limit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return null;
  }
};
