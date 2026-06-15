import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Calculator from '../Calculator.jsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function getDisplay() {
  return document.querySelector('.result').textContent
}

// Scope to the keypad so single-digit labels don't collide with the display
function click(label) {
  const keypad = document.querySelector('.keys')
  fireEvent.click(within(keypad).getByText(label))
}

function pressKey(key, options = {}) {
  fireEvent.keyDown(window, { key, ...options })
}

describe('Calculator', () => {
  beforeEach(() => {
    render(<Calculator />)
  })

  // ─── Initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should display 0 on mount', () => {
      expect(getDisplay()).toBe('0')
    })
  })

  // ─── Digit input ─────────────────────────────────────────────────────────

  describe('digit input', () => {
    it('should update display when a digit button is clicked', () => {
      click('5')
      expect(getDisplay()).toBe('5')
    })

    it('should build a multi-digit number when digits are clicked sequentially', () => {
      click('1')
      click('2')
      click('3')
      expect(getDisplay()).toBe('123')
    })

    it('should replace the initial 0 with the first digit clicked', () => {
      click('7')
      expect(getDisplay()).toBe('7')
    })

    it('should not exceed 12 significant digits', () => {
      for (let i = 0; i < 15; i++) click('1')
      const digits = getDisplay().replace('-', '').replace('.', '')
      expect(digits.length).toBeLessThanOrEqual(12)
    })
  })

  // ─── Decimal input ───────────────────────────────────────────────────────

  describe('decimal input', () => {
    it('should append a decimal point to the current number', () => {
      click('5')
      click('.')
      click('3')
      expect(getDisplay()).toBe('5.3')
    })

    it('should not allow a second decimal point', () => {
      click('5')
      click('.')
      click('3')
      click('.')
      expect(getDisplay()).toBe('5.3')
    })

    it('should show 0. when decimal is pressed as the first input', () => {
      click('.')
      expect(getDisplay()).toBe('0.')
    })

    it('should start a new decimal number after an operator', () => {
      click('5')
      click('+')
      click('.')
      expect(getDisplay()).toBe('0.')
    })
  })

  // ─── Arithmetic operations ────────────────────────────────────────────────

  describe('arithmetic operations', () => {
    it('should add two integers', () => {
      click('5')
      click('+')
      click('3')
      click('=')
      expect(getDisplay()).toBe('8')
    })

    it('should subtract two integers', () => {
      click('9')
      click('−')
      click('4')
      click('=')
      expect(getDisplay()).toBe('5')
    })

    it('should multiply two integers', () => {
      click('3')
      click('×')
      click('4')
      click('=')
      expect(getDisplay()).toBe('12')
    })

    it('should divide two integers evenly', () => {
      click('8')
      click('÷')
      click('2')
      click('=')
      expect(getDisplay()).toBe('4')
    })

    it('should show Error when dividing by zero', () => {
      click('5')
      click('÷')
      click('0')
      click('=')
      expect(getDisplay()).toBe('Error')
    })

    it('should chain operations correctly', () => {
      click('2')
      click('+')
      click('3')
      click('×')
      // At this point 2+3 should have resolved to 5
      click('4')
      click('=')
      expect(getDisplay()).toBe('20')
    })

    // RC-2 regression: format() was building display from raw JS float
    it('should display 0.3 for 0.1 + 0.2, not raw float noise — RC-2 regression', () => {
      click('0')
      click('.')
      click('1')
      click('+')
      click('0')
      click('.')
      click('2')
      click('=')
      expect(getDisplay()).toBe('0.3')
    })

    it('should display very large numbers in exponential notation', () => {
      // 999999999999 × 1000 exceeds 1e12
      for (let i = 0; i < 12; i++) click('9')
      click('×')
      click('1')
      click('0')
      click('0')
      click('0')
      click('=')
      expect(getDisplay()).toMatch(/e\+/)
    })

    it('should display very small numbers in exponential notation', () => {
      // 1 ÷ 1000000000 = 1e-9, below 1e-6 threshold
      click('1')
      click('÷')
      click('1')
      for (let i = 0; i < 9; i++) click('0')
      click('=')
      expect(getDisplay()).toMatch(/e-/)
    })
  })

  // ─── Clear (AC) ───────────────────────────────────────────────────────────

  describe('clear (AC)', () => {
    it('should reset display to 0', () => {
      click('5')
      click('AC')
      expect(getDisplay()).toBe('0')
    })

    it('should reset display to 0 from an Error state', () => {
      click('5')
      click('÷')
      click('0')
      click('=')
      expect(getDisplay()).toBe('Error')
      click('AC')
      expect(getDisplay()).toBe('0')
    })

    it('should allow a fresh calculation after AC', () => {
      click('3')
      click('+')
      click('4')
      click('AC')
      click('6')
      click('+')
      click('2')
      click('=')
      expect(getDisplay()).toBe('8')
    })
  })

  // ─── Toggle sign ──────────────────────────────────────────────────────────

  describe('toggle sign (+/−)', () => {
    it('should negate a positive number', () => {
      click('5')
      click('+/−')
      expect(getDisplay()).toBe('-5')
    })

    it('should un-negate a negative number', () => {
      click('5')
      click('+/−')
      click('+/−')
      expect(getDisplay()).toBe('5')
    })

    it('should not toggle the sign of 0', () => {
      click('+/−')
      expect(getDisplay()).toBe('0')
    })
  })

  // ─── Percent ─────────────────────────────────────────────────────────────

  describe('percent (%)', () => {
    it('should divide the display value by 100', () => {
      click('5')
      click('0')
      click('%')
      expect(getDisplay()).toBe('0.5')
    })

    it('should not crash on 0 percent', () => {
      click('%')
      expect(getDisplay()).toBe('0')
    })
  })

  // ─── Error state recovery ─────────────────────────────────────────────────

  describe('error state recovery', () => {
    it('should clear Error and accept a new digit', () => {
      click('5')
      click('÷')
      click('0')
      click('=')
      expect(getDisplay()).toBe('Error')
      click('3')
      expect(getDisplay()).toBe('3')
    })

    it('should clear Error when decimal is pressed', () => {
      click('5')
      click('÷')
      click('0')
      click('=')
      click('.')
      expect(getDisplay()).toBe('0')
    })

    it('should clear Error when Backspace is pressed via keyboard', () => {
      pressKey('5')
      pressKey('/')
      pressKey('0')
      pressKey('Enter')
      expect(getDisplay()).toBe('Error')
      pressKey('Backspace')
      expect(getDisplay()).toBe('0')
    })
  })

  // ─── Keyboard input ───────────────────────────────────────────────────────

  describe('keyboard input', () => {
    it('should respond to digit keys 0-9', () => {
      pressKey('7')
      expect(getDisplay()).toBe('7')
    })

    it('should respond to the decimal key', () => {
      pressKey('.')
      expect(getDisplay()).toBe('0.')
    })

    it('should respond to + key for addition', () => {
      pressKey('5')
      pressKey('+')
      pressKey('3')
      pressKey('Enter')
      expect(getDisplay()).toBe('8')
    })

    it('should respond to - key for subtraction', () => {
      pressKey('9')
      pressKey('-')
      pressKey('4')
      pressKey('Enter')
      expect(getDisplay()).toBe('5')
    })

    it('should respond to * key for multiplication', () => {
      pressKey('3')
      pressKey('*')
      pressKey('4')
      pressKey('Enter')
      expect(getDisplay()).toBe('12')
    })

    it('should respond to / key for division', () => {
      pressKey('8')
      pressKey('/')
      pressKey('2')
      pressKey('Enter')
      expect(getDisplay()).toBe('4')
    })

    it('should respond to Escape key to clear', () => {
      pressKey('5')
      pressKey('Escape')
      expect(getDisplay()).toBe('0')
    })

    it('should respond to Backspace key to delete the last digit', () => {
      pressKey('1')
      pressKey('2')
      pressKey('3')
      pressKey('Backspace')
      expect(getDisplay()).toBe('12')
    })

    it('should respond to Backspace on a single digit by resetting to 0', () => {
      pressKey('5')
      pressKey('Backspace')
      expect(getDisplay()).toBe('0')
    })

    it('should respond to = key to trigger equals', () => {
      pressKey('6')
      pressKey('+')
      pressKey('2')
      pressKey('=')
      expect(getDisplay()).toBe('8')
    })

    it('should respond to % key for percent', () => {
      pressKey('5')
      pressKey('0')
      pressKey('%')
      expect(getDisplay()).toBe('0.5')
    })

    it('should call preventDefault for the / key to prevent browser find', () => {
      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })
      const spy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    it('should call preventDefault for Enter to prevent form submission', () => {
      pressKey('5')
      pressKey('+')
      pressKey('3')
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      const spy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    // RC-3 regression: Backspace handler was missing e.preventDefault()
    // allowing browser back-navigation while the calculator is active.
    // This test FAILS on the unfixed source and PASSES after the RC-3 fix.
    it('should call preventDefault for Backspace to prevent browser back-navigation — RC-3 regression', () => {
      pressKey('1')
      pressKey('2')
      const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
      const spy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    // RC-1 smoke test: verifies keyboard still responds correctly after multiple
    // re-renders (the dep-array fix prevents stale/duplicate listeners).
    it('should handle keyboard input correctly after multiple re-renders — RC-1 smoke test', () => {
      click('1')
      click('2')
      click('3')
      pressKey('Escape')
      expect(getDisplay()).toBe('0')
      pressKey('9')
      expect(getDisplay()).toBe('9')
    })
  })

  // ─── Accessibility (E3) ───────────────────────────────────────────────────

  describe('accessibility — aria-labels (E3)', () => {
    it('should render operator buttons with descriptive aria-labels', () => {
      expect(screen.getByRole('button', { name: 'divide' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'multiply' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'subtract' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'add' })).toBeTruthy()
    })

    it('should render function buttons with descriptive aria-labels', () => {
      expect(screen.getByRole('button', { name: 'all clear' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'toggle sign' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'percent' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'equals' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'decimal point' })).toBeTruthy()
    })

    it('should render digit buttons with matching aria-labels', () => {
      for (const d of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        expect(screen.getByRole('button', { name: d })).toBeTruthy()
      }
    })
  })

  // ─── Backspace edge cases ─────────────────────────────────────────────────

  describe('backspace edge cases', () => {
    it('should be a no-op when waitingForOperand is true', () => {
      click('5')
      click('+')
      // waitingForOperand is true here; backspace should do nothing
      pressKey('Backspace')
      expect(getDisplay()).toBe('5')
    })

    it('should reset to 0 when backspacing a negative single digit', () => {
      click('5')
      click('+/−')
      expect(getDisplay()).toBe('-5')
      pressKey('Backspace')
      expect(getDisplay()).toBe('0')
    })
  })

  // ─── Percent guard (E4) ───────────────────────────────────────────────────

  describe('percent — waitingForOperand guard (E4)', () => {
    it('should not apply percent to stale display when waitingForOperand is true', () => {
      click('5')
      click('×')
      // waitingForOperand=true here; percent should be a no-op
      click('%')
      // the display should still show '5' (not 0.05)
      expect(getDisplay()).toBe('5')
    })
  })

  // ─── equals no-op cases ───────────────────────────────────────────────────

  describe('equals no-op cases', () => {
    it('should not change display when equals is pressed with no operator set', () => {
      click('7')
      click('=')
      expect(getDisplay()).toBe('7')
    })

    it('should not change display when equals is pressed in Error state', () => {
      click('5')
      click('÷')
      click('0')
      click('=')
      expect(getDisplay()).toBe('Error')
      // pressing = again in Error state must not throw or change display
      click('=')
      expect(getDisplay()).toBe('Error')
    })
  })

  // ─── performOperation in Error state ─────────────────────────────────────

  describe('performOperation in Error state', () => {
    it('should ignore an operator press when display is Error', () => {
      click('5')
      click('÷')
      click('0')
      click('=')
      expect(getDisplay()).toBe('Error')
      click('+')
      // display must still show Error
      expect(getDisplay()).toBe('Error')
    })
  })

  // ─── Repeat = replay (E7) ─────────────────────────────────────────────────

  describe('repeat = replay (E7)', () => {
    it('should replay the last addition when = is pressed again', () => {
      click('5')
      click('+')
      click('3')
      click('=')
      expect(getDisplay()).toBe('8')
      click('=')
      expect(getDisplay()).toBe('11')
    })

    it('should replay multiple times consecutively', () => {
      click('1')
      click('0')
      click('+')
      click('5')
      click('=')
      expect(getDisplay()).toBe('15')
      click('=')
      expect(getDisplay()).toBe('20')
      click('=')
      expect(getDisplay()).toBe('25')
    })

    it('should replay subtraction', () => {
      click('2')
      click('0')
      click('−')
      click('3')
      click('=')
      expect(getDisplay()).toBe('17')
      click('=')
      expect(getDisplay()).toBe('14')
    })

    it('should replay multiplication', () => {
      click('2')
      click('×')
      click('3')
      click('=')
      expect(getDisplay()).toBe('6')
      click('=')
      expect(getDisplay()).toBe('18')
    })

    it('should replay division', () => {
      click('1')
      click('0')
      click('0')
      click('÷')
      click('2')
      click('=')
      expect(getDisplay()).toBe('50')
      click('=')
      expect(getDisplay()).toBe('25')
    })

    it('should also replay via the Enter key', () => {
      pressKey('5')
      pressKey('+')
      pressKey('3')
      pressKey('Enter')
      expect(getDisplay()).toBe('8')
      pressKey('Enter')
      expect(getDisplay()).toBe('11')
    })

    it('should clear lastOperand/lastOperator when AC is pressed', () => {
      click('5')
      click('+')
      click('3')
      click('=')
      expect(getDisplay()).toBe('8')
      click('AC')
      // After AC, no last operation → = should be a no-op
      click('7')
      click('=')
      expect(getDisplay()).toBe('7')
    })

    it('should not replay when Error is on display', () => {
      click('6')
      click('÷')
      click('2')
      click('=')
      expect(getDisplay()).toBe('3')
      click('=')
      expect(getDisplay()).toBe('1.5')
      // Now get into error state and confirm = does nothing
      click('AC')
      click('5')
      click('÷')
      click('0')
      click('=')
      expect(getDisplay()).toBe('Error')
      click('=')
      expect(getDisplay()).toBe('Error')
    })
  })
})
