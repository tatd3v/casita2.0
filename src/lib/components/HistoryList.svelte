<script lang="ts">
  import type { FeedingRecord, HistoryCopy, Locale, FeedingState, FeedingSlot } from '../types'

  export let history: FeedingRecord[] = []
  export let copy: HistoryCopy
  export let locale: Locale = 'es'
  export let state: FeedingState | null = null

  $: groupedHistory = history.reduce((groups, record) => {
    const date = new Date(record.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
    return groups
  }, {} as Record<string, FeedingRecord[]>)

  $: sortedGroupedHistory = Object.fromEntries(
    Object.entries(groupedHistory).map(([date, records]) => [
      date,
      records.sort((a, b) => {
        // Sort by slot priority: pending slots first, then by time
        const aPending = isSlotPending(a.slot)
        const bPending = isSlotPending(b.slot)
        
        if (aPending && !bPending) return -1
        if (!aPending && bPending) return 1
        
        // If both have same pending status, sort by time (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
    ])
  )

  function isSlotPending(slot: string): boolean {
    // Check if the current state for this slot is not done
    const currentState = state?.slots[slot as FeedingSlot]
    return !currentState?.done
  }

  $: localeOptions = { 
    es: 'es-ES', 
    en: 'en-US' 
  }
</script>

<section class="history">
  <header>
    <h3>{copy.title}</h3>
  </header>

  {#if history.length}
    <div class="history-groups">
      {#each Object.entries(sortedGroupedHistory) as [dateString, records] (dateString)}
        <div class="day-group">
          <div class="day-header">
            <h4>{new Date(dateString).toLocaleDateString(localeOptions[locale], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h4>
          </div>
          <ul>
            {#each records as record (record.timestamp)}
              <li>
                <div>
                  <strong>{copy.slotLabels[record.slot]}</strong>
                  <span>{record.caretaker}</span>
                </div>
                <div class="timestamp">
                  <span class="time">{new Date(record.timestamp).toLocaleTimeString(localeOptions[locale], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  {:else}
    <div class="history__empty">
      <p>{copy.emptyMessage}</p>
    </div>
  {/if}
</section>

<style>
  .history {
    border-radius: 1.25rem;
    padding: 1.5rem;
    background: rgba(255, 254, 236, 0.9);
    border: 1px solid rgba(203, 216, 59, 0.1);
    box-shadow: 0 1rem 2.5rem rgba(71, 85, 105, 0.1);
  }

  @media (max-width: 768px) {
    .history {
      padding: 1.25rem;
      border-radius: 1rem;
    }
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    header {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    h3 {
      font-size: 1.05rem;
    }
  }

  header p {
    margin: 0;
    color: var(--color-slate);
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    header p {
      font-size: 0.85rem;
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    ul {
      gap: 0.6rem;
    }
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid rgba(203, 216, 59, 0.1);
  }

  @media (max-width: 768px) {
    li {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      padding-bottom: 0.75rem;
    }
  }

  li:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  strong {
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    strong {
      font-size: 0.9rem;
    }
  }

  li span {
    display: block;
    font-size: 0.85rem;
    color: var(--color-slate-light);
  }

  .timestamp {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
  }

  .timestamp .date {
    font-size: 0.8rem;
    color: var(--color-slate-light);
    font-weight: 500;
  }

  .timestamp .time {
    font-size: 0.85rem;
    color: var(--color-slate-light);
  }

  @media (max-width: 768px) {
    li span {
      font-size: 0.8rem;
    }
    
    .timestamp {
      align-items: flex-start;
      gap: 0.15rem;
    }
    
    .timestamp .date {
      font-size: 0.75rem;
    }
    
    .timestamp .time {
      font-size: 0.8rem;
    }
  }

  .history__empty {
    padding: 0.75rem 0;
    font-size: 0.9rem;
    color: var(--color-slate-light);
  }

  .history-groups {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .day-group {
    background: linear-gradient(145deg, rgba(168, 138, 237, 0.05), rgba(203, 216, 59, 0.05));
    border-radius: 1rem;
    padding: 1rem;
    border: 1px solid rgba(168, 138, 237, 0.1);
  }

  .day-header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(203, 216, 59, 0.15);
  }

  .day-header h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-indigo-dark);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .history__empty {
      padding: 1rem 0;
      font-size: 0.85rem;
      text-align: center;
    }
    
    .history-groups {
      gap: 0.75rem;
    }
    
    .day-group {
      padding: 0.875rem;
      border-radius: 0.875rem;
    }
    
    .day-header {
      margin-bottom: 0.625rem;
      padding-bottom: 0.375rem;
    }
    
    .day-header h4 {
      font-size: 0.95rem;
    }
  }
</style>
