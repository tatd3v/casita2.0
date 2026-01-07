// Test functions for automatic daily reset
import type { FeedingState } from './types'
import { todayId, blankState } from './storage'

// Test reset logic with different times
export const testResetLogic = () => {
  console.log('🕐 Testing automatic reset logic...\n')
  
  const testCases = [
    { hour: 6, expected: false, description: '6 AM - Before reset time' },
    { hour: 7, expected: true, description: '7 AM - At reset time' },
    { hour: 8, expected: true, description: '8 AM - After reset time' },
    { hour: 23, expected: true, description: '11 PM - Same day after reset' },
  ]
  
  testCases.forEach(({ hour, expected, description }) => {
    const result = shouldResetAtHour(hour)
    console.log(`${description}: ${result ? '✅ RESET' : '❌ NO RESET'} (expected: ${expected ? 'RESET' : 'NO RESET'})`)
  })
}

// Simulate reset check at specific hour
const shouldResetAtHour = (testHour: number): boolean => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayId = yesterday.toISOString().slice(0, 10)
  
  // Simulate checking at testHour
  const currentHour = testHour
  const resetHour = 7 // 7 AM reset time
  
  // Check if it's a different day AND past reset hour
  const isDifferentDay = yesterdayId !== todayId()
  const pastResetHour = currentHour >= resetHour
  
  return isDifferentDay && pastResetHour
}

// Test with actual state data
export const testResetWithState = async (currentState: FeedingState) => {
  console.log('\n🔄 Testing reset with current state...')
  console.log('Current state date:', currentState.date)
  console.log('Today:', todayId())
  
  // Simulate different scenarios
  const scenarios = [
    { hour: 6, description: 'Before 7 AM reset' },
    { hour: 7, description: 'At 7 AM reset' },
    { hour: 8, description: 'After 7 AM reset' },
  ]
  
  scenarios.forEach(({ hour, description }) => {
    const shouldReset = shouldResetAtHour(hour)
    console.log(`${description}: ${shouldReset ? '🔄 WOULD RESET' : '⏸️ NO RESET'}`)
  })
}

// Create a test state with completed feedings
export const createTestState = (): FeedingState => ({
  date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Yesterday
  slots: {
    morning: { 
      slot: 'morning', 
      done: true, 
      caretaker: 'Test User', 
      timestamp: new Date().toISOString() 
    },
    evening: { 
      slot: 'evening', 
      done: true, 
      caretaker: 'Test User', 
      timestamp: new Date().toISOString() 
    }
  }
})

// Manual reset test at 7 AM
export const simulate7AMReset = () => {
  console.log('\n⏰ Simulating 7 AM reset check...')
  
  const testState = createTestState()
  console.log('Test state (yesterday with completed feedings):', testState)
  
  const resetHour = 7
  const currentHour = new Date().getHours()
  
  console.log(`Current hour: ${currentHour}`)
  console.log(`Reset hour: ${resetHour}`)
  
  if (currentHour >= resetHour) {
    console.log('✅ Reset condition met - would create new blank state')
    return blankState()
  } else {
    console.log('❌ Reset condition not met - would keep current state')
    return testState
  }
}
