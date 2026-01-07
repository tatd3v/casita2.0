<script lang="ts">
  import { onMount } from 'svelte';
  import catsIcon from './assets/cats-icon.png';
  import FeedingCard from './lib/components/FeedingCard.svelte'
  import HistoryList from './lib/components/HistoryList.svelte'
  import ConfirmModal from './lib/components/ConfirmModal.svelte'
  import {
    addHistoryRecord,
    blankState,
    loadHistory,
    loadState,
    manualReset,
    removeHistoryRecord,
    saveState,
    subscribeToStateChanges,
    subscribeToHistoryChanges,
  } from './lib/storage';
  import { COPIES } from './lib/copy'
  import { CARETAKER_NAMES, type CaretakerName } from './lib/types'
  import type { FeedingRecord, FeedingSlot, FeedingState, Locale } from './lib/types'

  let loading = true
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
  let showResetModal = false
  $: copy = COPIES[locale]

  onMount(() => {
    // Load initial data
    loadData()
    
    // Set up real-time subscriptions
    const stateSubscription = subscribeToStateChanges((newState) => {
      state = newState
      updateCaretakerStates(newState)
    })
    
    const historySubscription = subscribeToHistoryChanges((newHistory) => {
      history = newHistory
    })
    
    // Cleanup subscriptions on unmount
    return () => {
      stateSubscription.unsubscribe()
      historySubscription.unsubscribe()
    }
  });

  const loadData = async () => {
    try {
      loading = true
      const currentState = await loadState()
      const currentHistory = await loadHistory()
      
      state = currentState
      history = currentHistory
      
      updateCaretakerStates(currentState)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      loading = false
    }
  }

  const updateCaretakerStates = (currentState: FeedingState) => {
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
  }

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

  const handleManualReset = async () => {
    showResetModal = true
  }

  const confirmReset = async () => {
    state = await manualReset()
    caretakers = { morning: '', evening: '' }
    selectedCaretakers = { morning: 'other', evening: 'other' }
    customCaretakers = { morning: '', evening: '' }
    showResetModal = false
  }

  const cancelReset = () => {
    showResetModal = false
  }

  const toggleSlot = async (slot: FeedingSlot) => {
    const current = state.slots[slot]
    if (!current.done) {
      const caretaker = (caretakers[slot] || '').trim() || copy.general.fallbackCaretaker
      const timestamp = new Date().toISOString()
      const newState = {
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
      }
      state = newState
      await saveState(newState)
      
      const record = {
        slot,
        caretaker,
        date: state.date,
        timestamp,
      }
      history = await addHistoryRecord(record, history)
    } else {
      const newState = {
        ...state,
        slots: {
          ...state.slots,
          [slot]: {
            slot,
            done: false,
          },
        },
      }
      state = newState
      await saveState(newState)
      
      caretakers = { ...caretakers, [slot]: '' }
      selectedCaretakers = { ...selectedCaretakers, [slot]: 'other' }
      customCaretakers = { ...customCaretakers, [slot]: '' }
      history = await removeHistoryRecord(slot, state.date, history)
    }
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
    <div class="hero__title">
      <img src={catsIcon} alt="Cats" class="hero__icon" />
      <h1>{copy.hero.title}</h1>
      <img src={catsIcon} alt="Cats" class="hero__icon" />
    </div>
    <p class="lead">{copy.hero.lead}</p>
  </section>

  <section class="dashboard">
    <div class="mobile-order">
      <HistoryList {history} copy={copy.history} {locale} {state} />
    </div>
    
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
  </section>
</main>

<ConfirmModal
  isOpen={showResetModal}
  title={copy.general.resetModalTitle}
  message={copy.general.resetModalMessage}
  confirmText={copy.general.resetModalConfirm}
  cancelText={copy.general.resetModalCancel}
  onConfirm={confirmReset}
  onCancel={cancelReset}
/>
