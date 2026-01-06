<script lang="ts">
  import { onMount } from 'svelte';
  import FeedingCard from './lib/components/FeedingCard.svelte'
  import HistoryList from './lib/components/HistoryList.svelte'
  import {
    addHistoryRecord,
    blankState,
    loadHistory,
    loadState,
    manualReset,
    removeHistoryRecord,
    saveState,
  } from './lib/storage';
  import { COPIES } from './lib/copy'
  import { CARETAKER_NAMES, type CaretakerName } from './lib/types'
  import type { FeedingRecord, FeedingSlot, FeedingState, Locale } from './lib/types'

  let state: FeedingState = blankState()
  let history: FeedingRecord[] = []
  let caretakers: Record<FeedingSlot, string> = {
    morning: '',
    evening: '',
  }
  let selectedCaretakers: Record<FeedingSlot, CaretakerName | 'other'> = {
    morning: 'other',
    evening: 'other',
  }
  let customCaretakers: Record<FeedingSlot, string> = {
    morning: '',
    evening: '',
  }
  let locale: Locale = 'es'
  $: copy = COPIES[locale]

  onMount(() => {
    const currentState = loadState()
    state = currentState
    
    // Initialize caretaker states for each slot
    const slots: FeedingSlot[] = ['morning', 'evening']
    slots.forEach(slot => {
      const caretaker = currentState.slots[slot].caretaker ?? ''
      caretakers[slot] = caretaker
      
      // Check if caretaker is in the predefined list
      if (CARETAKER_NAMES.includes(caretaker as CaretakerName)) {
        selectedCaretakers[slot] = caretaker as CaretakerName
        customCaretakers[slot] = ''
      } else {
        selectedCaretakers[slot] = 'other'
        customCaretakers[slot] = caretaker
      }
    })
    
    history = loadHistory();
  });

  const updateCaretaker = (slot: FeedingSlot, value: string) => {
    caretakers = { ...caretakers, [slot]: value }
  }

  const updateSelectedCaretaker = (slot: FeedingSlot, value: CaretakerName | 'other') => {
    selectedCaretakers = { ...selectedCaretakers, [slot]: value }
    if (value !== 'other') {
      caretakers[slot] = value
      customCaretakers[slot] = ''
    } else {
      caretakers[slot] = customCaretakers[slot]
    }
  }

  const updateCustomCaretaker = (slot: FeedingSlot, value: string) => {
    customCaretakers = { ...customCaretakers, [slot]: value }
    if (selectedCaretakers[slot] === 'other') {
      caretakers[slot] = value
    }
  }

  const toggleLocale = () => {
    locale = locale === 'es' ? 'en' : 'es'
  }

  const handleManualReset = () => {
    state = manualReset()
    caretakers = { morning: '', evening: '' }
    selectedCaretakers = { morning: 'other', evening: 'other' }
    customCaretakers = { morning: '', evening: '' }
    // Keep all history records - don't clear today's records on manual reset
  }

  const toggleSlot = (slot: FeedingSlot) => {
    const current = state.slots[slot]
    if (!current.done) {
      const caretaker = (caretakers[slot] || '').trim() || copy.general.fallbackCaretaker
      const timestamp = new Date().toISOString()
      state = {
        ...state,
        slots: {
          ...state.slots,
          [slot]: {
            slot,
            done: true,
            caretaker,
            timestamp,
          },
        },
      };
      history = addHistoryRecord(
        {
          slot,
          caretaker,
          date: state.date,
          timestamp,
        },
        history,
      );
    } else {
      state = {
        ...state,
        slots: {
          ...state.slots,
          [slot]: {
            slot,
            done: false,
          },
        },
      };
      caretakers = { ...caretakers, [slot]: '' };
      selectedCaretakers = { ...selectedCaretakers, [slot]: 'other' };
      customCaretakers = { ...customCaretakers, [slot]: '' };
      history = removeHistoryRecord(slot, state.date, history);
    }
    saveState(state);
  }
</script>

<main class="shell">
  <section class="hero">
    <div class="hero__top">
      <p class="eyebrow">{copy.hero.eyebrow}</p>
      <div class="hero__actions">
        <button class="reset-button" on:click={handleManualReset} aria-label={copy.general.resetButton}>
          {copy.general.resetButton}
        </button>
        <button class="language" on:click={toggleLocale} aria-label={copy.general.toggleLabel}>
          {copy.general.toggleLabel}
        </button>
      </div>
    </div>
    <h1>{copy.hero.title}</h1>
    <p class="lead">{copy.hero.lead}</p>
  </section>

  <section class="dashboard">
    <div class="cards">
      <FeedingCard
        status={state.slots.morning}
        caretaker={caretakers.morning}
        selectedCaretaker={selectedCaretakers.morning}
        customCaretaker={customCaretakers.morning}
        onSelectedCaretakerChange={(value) => updateSelectedCaretaker('morning', value)}
        onCustomCaretakerChange={(value) => updateCustomCaretaker('morning', value)}
        onToggle={() => toggleSlot('morning')}
        copy={copy.card}
      />
      <FeedingCard
        status={state.slots.evening}
        caretaker={caretakers.evening}
        selectedCaretaker={selectedCaretakers.evening}
        customCaretaker={customCaretakers.evening}
        onSelectedCaretakerChange={(value) => updateSelectedCaretaker('evening', value)}
        onCustomCaretakerChange={(value) => updateCustomCaretaker('evening', value)}
        onToggle={() => toggleSlot('evening')}
        copy={copy.card}
      />
    </div>

    <HistoryList {history} copy={copy.history} />
  </section>
</main>
