import { useEffect, useState } from 'react'
import './Calculator.css'

const MAX_DIGITS = 12

// ASCII keys are state tokens; Unicode symbols are display-only
const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' }

function format(value) {
  if (value === 'Error') return value
  const num = Number(value)
  if (!Number.isFinite(num)) return 'Error'
  if (Math.abs(num) >= 1e12 || (num !== 0 && Math.abs(num) < 1e-6)) {
    return num.toExponential(6)
  }
  const str = String(parseFloat(num.toPrecision(10)))
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.')
    const trimmedDec = decPart.slice(0, MAX_DIGITS - intPart.length)
    return trimmedDec ? `${intPart}.${trimmedDec}` : intPart
  }
  return str.slice(0, MAX_DIGITS)
}

function compute(a, b, op) {
  const x = Number(a)
  const y = Number(b)
  switch (op) {
    case '+': return x + y
    case '-': return x - y
    case '*': return x * y
    case '/':
      if (y === 0) return 'Error'
      return x / y
    default:
      return 'Error'
  }
}

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previous, setPrevious] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [lastOperand, setLastOperand] = useState(null)
  const [lastOperator, setLastOperator] = useState(null)

  const inputDigit = (digit) => {
    if (display === 'Error') {
      clearAll()
      setDisplay(String(digit))
      return
    }
    if (waitingForOperand) {
      setDisplay(String(digit))
      setWaitingForOperand(false)
      return
    }
    if (display.replace('-', '').replace('.', '').length >= MAX_DIGITS) return
    setDisplay(display === '0' ? String(digit) : display + digit)
  }

  const inputDecimal = () => {
    if (display === 'Error') {
      clearAll()
      return
    }
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clearAll = () => {
    setDisplay('0')
    setPrevious(null)
    setOperator(null)
    setWaitingForOperand(false)
    setLastOperand(null)
    setLastOperator(null)
  }

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)
  }

  const percent = () => {
    if (display === 'Error' || waitingForOperand) return
    const value = parseFloat(display) / 100
    setDisplay(format(value))
  }

  const performOperation = (nextOperator) => {
    if (display === 'Error') return
    const inputValue = parseFloat(display)

    if (previous === null) {
      setPrevious(inputValue)
    } else if (operator && !waitingForOperand) {
      const result = compute(previous, inputValue, operator)
      const formatted = format(result)
      setDisplay(formatted)
      if (result === 'Error') {
        // Full reset on error — don't leave operator set with null previous
        setPrevious(null)
        setOperator(null)
        setWaitingForOperand(false)
        return
      }
      setPrevious(Number(formatted))
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const handleEquals = () => {
    if (display === 'Error') return

    // Replay mode: no active operator but a saved last operation exists
    if (operator === null) {
      if (lastOperator === null || lastOperand === null) return
      const result = compute(parseFloat(display), lastOperand, lastOperator)
      setDisplay(format(result))
      setWaitingForOperand(true)
      return
    }

    if (waitingForOperand) return

    const inputValue = parseFloat(display)
    const result = compute(previous, inputValue, operator)
    setDisplay(format(result))
    setLastOperand(inputValue)
    setLastOperator(operator)
    setPrevious(null)
    setOperator(null)
    setWaitingForOperand(true)
  }

  const backspace = () => {
    if (display === 'Error') {
      clearAll()
      return
    }
    if (waitingForOperand) return
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0')
      return
    }
    setDisplay(display.slice(0, -1))
  }

  useEffect(() => {
    const handleKey = (e) => {
      const { key } = e
      if (/^[0-9]$/.test(key)) {
        inputDigit(parseInt(key, 10))
      } else if (key === '.') {
        inputDecimal()
      } else if (key === '+') {
        performOperation('+')
      } else if (key === '-') {
        performOperation('-')
      } else if (key === '*') {
        performOperation('*')
      } else if (key === '/') {
        e.preventDefault()
        performOperation('/')
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault()
        handleEquals()
      } else if (key === 'Backspace') {
        e.preventDefault()
        backspace()
      } else if (key === 'Escape') {
        clearAll()
      } else if (key === '%') {
        percent()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [display, operator, waitingForOperand, previous, lastOperand, lastOperator])

  const buttons = [
    { label: 'AC', aria: 'all clear', type: 'fn', onClick: clearAll },
    { label: '+/−', aria: 'toggle sign', type: 'fn', onClick: toggleSign },
    { label: '%', aria: 'percent', type: 'fn', onClick: percent },
    { label: '÷', aria: 'divide', type: 'op', onClick: () => performOperation('/'), active: operator === '/' && waitingForOperand },
    { label: '7', aria: '7', type: 'num', onClick: () => inputDigit(7) },
    { label: '8', aria: '8', type: 'num', onClick: () => inputDigit(8) },
    { label: '9', aria: '9', type: 'num', onClick: () => inputDigit(9) },
    { label: '×', aria: 'multiply', type: 'op', onClick: () => performOperation('*'), active: operator === '*' && waitingForOperand },
    { label: '4', aria: '4', type: 'num', onClick: () => inputDigit(4) },
    { label: '5', aria: '5', type: 'num', onClick: () => inputDigit(5) },
    { label: '6', aria: '6', type: 'num', onClick: () => inputDigit(6) },
    { label: '−', aria: 'subtract', type: 'op', onClick: () => performOperation('-'), active: operator === '-' && waitingForOperand },
    { label: '1', aria: '1', type: 'num', onClick: () => inputDigit(1) },
    { label: '2', aria: '2', type: 'num', onClick: () => inputDigit(2) },
    { label: '3', aria: '3', type: 'num', onClick: () => inputDigit(3) },
    { label: '+', aria: 'add', type: 'op', onClick: () => performOperation('+'), active: operator === '+' && waitingForOperand },
    { label: '0', aria: '0', type: 'num wide', onClick: () => inputDigit(0) },
    { label: '.', aria: 'decimal point', type: 'num', onClick: inputDecimal },
    { label: '=', aria: 'equals', type: 'eq', onClick: handleEquals },
  ]

  const expression = previous !== null
    ? `${format(String(previous))} ${operator ? OP_SYMBOL[operator] : ''}`.trim()
    : ''

  return (
    <div className="calc-wrapper">
      <header className="calc-header">
        <svg className="calc-header-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="5" y="5" width="10" height="3" rx="0.75" fill="currentColor" opacity="0.7"/>
          <rect x="5" y="10" width="2.2" height="2.2" rx="0.5" fill="currentColor" opacity="0.6"/>
          <rect x="8.9" y="10" width="2.2" height="2.2" rx="0.5" fill="currentColor" opacity="0.6"/>
          <rect x="12.8" y="10" width="2.2" height="2.2" rx="0.5" fill="currentColor" opacity="0.9"/>
          <rect x="5" y="13.8" width="2.2" height="2.2" rx="0.5" fill="currentColor" opacity="0.6"/>
          <rect x="8.9" y="13.8" width="2.2" height="2.2" rx="0.5" fill="currentColor" opacity="0.6"/>
          <rect x="12.8" y="13.8" width="2.2" height="2.2" rx="0.5" fill="currentColor" opacity="0.9"/>
        </svg>
        <span className="calc-header-title">Calculator</span>
      </header>
      <div className="calculator">
        <div className="display">
          <div className="expression">{expression}&nbsp;</div>
          <div
            className="result"
            aria-live="polite"
            aria-atomic="true"
            title={display}
          >
            {display}
          </div>
        </div>
        <div className="keys">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              aria-label={btn.aria}
              onClick={btn.onClick}
              className={`key key-${btn.type.split(' ')[0]}${
                btn.type.includes('wide') ? ' key-wide' : ''
              }${btn.active ? ' key-active' : ''}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
