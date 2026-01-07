<script lang="ts">
  import type {
    FeedingCardCopy,
    FeedingStatus,
    FeedingSlot,
    CaretakerName,
  } from '../types';
  import { CARETAKER_NAMES } from '../types';

  export let status: FeedingStatus;
  export let caretaker: string;
  export let selectedCaretaker: CaretakerName | 'other' = 'other';
  export let customCaretaker: string = '';
  export let onSelectedCaretakerChange: (
    value: CaretakerName | 'other',
  ) => void;
  export let onCustomCaretakerChange: (value: string) => void;
  export let onToggle: () => void;
  export let copy: FeedingCardCopy;

  const handleSelectChange = (event: Event) => {
    const value = (event.currentTarget as HTMLSelectElement).value as
      | CaretakerName
      | 'other';
    onSelectedCaretakerChange(value);
  };

  const handleInputChange = (event: Event) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    onCustomCaretakerChange(value);
  };
</script>

<article class={`card ${status.done ? 'card--done' : 'card--pending'}`}>
  <header>
    <h2>{copy.slotLabels[status.slot]}</h2>
    <span class={`badge ${status.done ? 'badge--done' : 'badge--pending'}`}>
      {status.done ? copy.badge.done : copy.badge.pending}
    </span>
  </header>

  <p class="card__description">
    {status.done
      ? copy.description.done(status.caretaker ?? copy.description.fallbackName)
      : copy.description.pending}
  </p>

  {#if status.timestamp}
    <p class="card__timestamp">
      {new Date(status.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </p>
  {/if}

  <label>
    <span>{copy.caretakerLabel}</span>
    <select
      value={selectedCaretaker}
      on:change={handleSelectChange}
      aria-label={copy.ariaLabel(copy.slotLabels[status.slot])}
      disabled={status.done}
    >
      <option value="other">{copy.otherOption}</option>
      {#each CARETAKER_NAMES as name}
        <option value={name}>{name}</option>
      {/each}
    </select>
  </label>

  {#if selectedCaretaker === 'other'}
    <label>
      <span>{copy.placeholder}</span>
      <input
        type="text"
        placeholder={copy.placeholder}
        value={customCaretaker}
        on:input={handleInputChange}
        disabled={status.done}
      />
    </label>
  {/if}

  <button class="primary" on:click={onToggle}>
    {status.done ? copy.button.done : copy.button.pending}
  </button>
</article>

<style>
  .card {
    border-radius: 1.25rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 1.25rem 3rem rgba(15, 44, 25, 0.15);
    transition:
      transform 200ms ease,
      border-color 300ms ease;
    min-height: 260px;
  }

  @media (max-width: 768px) {
    .card {
      padding: 1.25rem;
      min-height: 240px;
      gap: 0.75rem;
    }
  }

  .card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .card--pending {
    background: linear-gradient(
      145deg,
      var(--color-ivory),
      var(--color-ivory-dark)
    );
    border-color: rgba(168, 138, 237, 0.2);
  }

  .card--done {
    background: linear-gradient(
      145deg,
      rgba(203, 216, 59, 0.15),
      rgba(203, 216, 59, 0.25)
    );
    border-color: rgba(203, 216, 59, 0.3);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    header {
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }

  h2 {
    margin: 0;
    font-size: 1.35rem;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 1.25rem;
    }
  }

  .badge {
    border-radius: 999px;
    padding: 0.3rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .badge {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }
  }

  .badge--pending {
    background: rgba(168, 138, 237, 0.2);
    color: var(--color-indigo-dark);
  }

  .badge--done {
    background: rgba(203, 216, 59, 0.2);
    color: var(--color-pear-dark);
  }

  .card__description {
    margin: 0;
    color: var(--color-slate);
  }

  .card__timestamp {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-slate-light);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    label {
      gap: 0.5rem;
      font-size: 0.95rem;
    }
  }

  input,
  select {
    border-radius: 0.9rem;
    border: 2px solid rgba(203, 216, 59, 0.2);
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-family: inherit;
    background: var(--color-ivory);
    color: var(--color-slate-dark);
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
    min-height: 44px;
  }

  @media (max-width: 768px) {
    input,
    select {
      padding: 0.875rem 1rem;
      font-size: 16px;
      min-height: 48px;
    }
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--color-pear);
    box-shadow: 0 0 0 3px rgba(203, 216, 59, 0.1);
  }

  input::placeholder,
  select::placeholder {
    color: var(--color-slate-light);
  }

  input:disabled,
  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 48px;
    min-width: 48px;
  }

  @media (max-width: 768px) {
    button {
      padding: 1rem 1.25rem;
      font-size: 1rem;
      min-height: 52px;
    }
  }

  .primary {
    background: var(--color-indigo);
    color: #fff;
    transition: all 150ms ease;
    box-shadow: 0 0.25rem 0.75rem rgba(168, 138, 237, 0.25);
  }

  .card--done .primary {
    background: var(--color-pear);
    color: var(--color-slate-dark);
    box-shadow: 0 0.25rem 0.75rem rgba(203, 216, 59, 0.25);
  }

  .primary:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  .primary:focus-visible {
    outline: 2px solid var(--color-indigo);
    outline-offset: 2px;
  }

  .card--done .primary:focus-visible {
    outline-color: var(--color-pear);
  }
</style>
