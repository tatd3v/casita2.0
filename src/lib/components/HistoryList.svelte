<script lang="ts">
  import type { FeedingRecord, HistoryCopy } from '../types'

  export let history: FeedingRecord[] = []
  export let copy: HistoryCopy
</script>

<section class="history">
  <header>
    <h3>{copy.title}</h3>
    <p>{history.length ? copy.subtitleWithRecords : copy.subtitleEmpty}</p>
  </header>

  {#if history.length}
    <ul>
      {#each history as record (record.timestamp)}
        <li>
          <div>
            <strong>{copy.slotLabels[record.slot]}</strong>
            <span>{record.caretaker}</span>
          </div>
          <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </li>
      {/each}
    </ul>
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

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  header p {
    margin: 0;
    color: var(--color-slate);
    font-size: 0.9rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid rgba(203, 216, 59, 0.1);
  }

  li:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  strong {
    font-size: 0.95rem;
  }

  li span {
    display: block;
    font-size: 0.85rem;
    color: var(--color-slate-light);
  }

  .history__empty {
    padding: 0.75rem 0;
    font-size: 0.9rem;
    color: var(--color-slate-light);
  }
</style>
