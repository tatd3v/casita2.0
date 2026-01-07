<script lang="ts">
  import { onMount } from 'svelte'
  import type { FeedingRecord, HistoryCopy, Locale, FeedingState, FeedingSlot } from '../types'

  export let history: FeedingRecord[] = []
  export let copy: HistoryCopy
  export let locale: Locale = 'es'
  export let state: FeedingState | null = null

  // State for toggling old date groups
  let collapsedDates: Set<string> = new Set()
  // State for toggling entire history card on tiny screens
  let historyCollapsed = false

  // Auto-collapse history on tiny screens
  const isTinyScreen = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 480
    }
    return false
  }

  // Initialize collapsed state based on screen size
  $: historyCollapsed = isTinyScreen()

  // Handle window resize to auto-collapse/expand based on screen size
  let resizeTimeout: number

  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      historyCollapsed = isTinyScreen()
    }, 100) // Debounce resize events
  }

  // Set up resize listener when component mounts
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
      clearTimeout(resizeTimeout)
    }
  })

  // Auto-collapse old dates when history changes
  $: {
    if (history.length > 0) {
      const newCollapsed = new Set<string>()
      Object.keys(sortedGroupedHistory).forEach(dateString => {
        // Auto-collapse dates older than yesterday
        if (isCollapsible(dateString)) {
          newCollapsed.add(dateString)
        }
      })
      collapsedDates = newCollapsed
    }
  }

  // Toggle history card collapse (for tiny screens)
  function toggleHistoryCollapse() {
    historyCollapsed = !historyCollapsed
  }

  $: groupedHistory = history.reduce((groups, record) => {
    const date = new Date(record.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
    return groups
  }, {} as Record<string, FeedingRecord[]>)

  $: sortedGroupedHistory = Object.fromEntries(
    Object.entries(groupedHistory)
      .sort(([dateA], [dateB]) => {
        // Get today and yesterday dates for comparison
        const today = new Date().toDateString()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()
        
        // Priority: Today first, Yesterday second, then chronological (newest to oldest)
        if (dateA === today && dateB !== today) return -1
        if (dateB === today && dateA !== today) return 1
        if (dateA === yesterdayStr && dateB !== yesterdayStr && dateB !== today) return -1
        if (dateB === yesterdayStr && dateA !== yesterdayStr && dateA !== today) return 1
        
        // For all other dates, sort by date (newest first)
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      .map(([date, records]) => [
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

  // Check if a date is today
  function isToday(dateString: string): boolean {
    const today = new Date().toDateString()
    return dateString === today
  }

  // Check if a date is yesterday
  function isYesterday(dateString: string): boolean {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return dateString === yesterday.toDateString()
  }

  // Check if a date should be collapsible (not today or yesterday)
  function isCollapsible(dateString: string): boolean {
    return !isToday(dateString) && !isYesterday(dateString)
  }

  // Toggle collapsed state for a date
  function toggleDate(dateString: string) {
    if (collapsedDates.has(dateString)) {
      collapsedDates.delete(dateString)
    } else {
      collapsedDates.add(dateString)
    }
    collapsedDates = new Set(collapsedDates) // Trigger reactivity
  }

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

<section class="history" class:collapsed={historyCollapsed}>
  <header>
    <h3>{copy.title}</h3>
    <button class="history-toggle" on:click={toggleHistoryCollapse} aria-label="Toggle history">
      <div class="toggle-icon" class:collapsed={historyCollapsed}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </button>
  </header>

  {#if history.length}
    <div class="history-groups" class:collapsed={historyCollapsed}>
      {#each Object.entries(sortedGroupedHistory) as [dateString, records] (dateString)}
        <!-- Always show today, even when history is collapsed -->
        {#if !historyCollapsed || isToday(dateString)}
          <div class="day-group">
            <div class="day-header" class:clickable={isCollapsible(dateString)} on:click={() => isCollapsible(dateString) && toggleDate(dateString)}>
              <h4>{new Date(dateString).toLocaleDateString(localeOptions[locale], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h4>
              {#if isCollapsible(dateString)}
                <div class="toggle-icon" class:collapsed={collapsedDates.has(dateString)}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              {/if}
            </div>
            {#if !isCollapsible(dateString) || !collapsedDates.has(dateString)}
              <ul class:collapsed={isCollapsible(dateString) && collapsedDates.has(dateString)}>
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
            {/if}
          </div>
        {/if}
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
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  /* When collapsed, allow full height for today's content */
  .history.collapsed {
    max-height: none;
    overflow: visible;
  }

  @media (max-width: 768px) {
    .history {
      padding: 1.25rem;
      border-radius: 1rem;
      max-height: calc(100vh - 4rem);
    }
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .history-toggle {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--color-slate-light);
    border-radius: 0.25rem;
    transition: all 150ms ease;
    display: none !important;
  }

  .history-toggle:hover {
    background: rgba(203, 216, 59, 0.1);
    color: var(--color-slate);
  }

  .history-toggle:hover .toggle-icon {
    opacity: 1;
    color: var(--color-slate);
  }

  @media (max-width: 768px) {
    header {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
  }

  /* Show toggle button only on tiny screens */
  @media (max-width: 480px) {
    .history-toggle {
      display: block !important;
    }
    
    header {
      flex-direction: row;
      align-items: baseline;
      justify-content: space-between;
    }
  }

  /* Collapsed history styles */
  .history.collapsed {
    max-height: none;
    overflow: visible;
  }

  .history-groups.collapsed {
    max-height: 200px;
    overflow: hidden;
    transition: max-height 300ms ease;
  }

  /* When collapsed, show today's content fully */
  .history.collapsed .history-groups {
    max-height: none;
    overflow: visible;
    transition: max-height 300ms ease;
  }

  /* Allow today's group to be fully visible when collapsed */
  .history.collapsed .day-group:first-child {
    overflow: visible;
    max-height: none;
    padding: 1rem;
    margin: 0;
  }

  .history.collapsed .day-group:first-child .day-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .history.collapsed .day-group:first-child ul {
    overflow: visible;
    max-height: none;
  }

  .history.collapsed .day-group:not(:first-child) {
    display: none;
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
    flex: 1;
    overflow-y: auto;
    min-height: 0;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .day-header.clickable {
    cursor: pointer;
    user-select: none;
    transition: background-color 150ms ease;
  }

  .day-header.clickable:hover {
    background-color: rgba(203, 216, 59, 0.05);
    border-radius: 0.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .day-header h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-indigo-dark);
    font-weight: 600;
  }

  .toggle-icon {
    color: var(--color-slate-light);
    transition: transform 200ms ease;
    opacity: 0.7;
  }

  .toggle-icon.collapsed {
    transform: rotate(-90deg);
  }

  .day-header.clickable:hover .toggle-icon {
    opacity: 1;
    color: var(--color-slate);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    transition: all 200ms ease;
    overflow: hidden;
  }

  ul.collapsed {
    max-height: 0;
    opacity: 0;
    margin: 0;
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
