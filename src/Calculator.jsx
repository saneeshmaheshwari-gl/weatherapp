import { useEffect, useState } from 'react'
import './Calculator.css'

const MAX_DIGITS = 12

function format(value) {
  if (value === 'Error') return value
  const num = Number(value)
  if (!Number.isFinite(num)) return 'Error'
  if (Math.abs(num) >= 1e12 || (num !== 0 && Math.abs(num) < 1e-6)) {
    return num.toExponential(6)
  }
  const str = String(value)
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
    case '+':
      return x + y
    case '−':
      return x - y
    case '×':
      return x * y
    case '÷':
      if (y === 0) return 'Error'
      return x / y
    default:
      return y
  }
}

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previous, setPrevious] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputDigit = (digit) => {
    if (display === 'Error') {
      clearAll()
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
  }

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return
    setDisplay(
      display.startsWith('-') ? display.slice(1) : '-' + display,
    )
  }

  const percent = () => {
    if (display === 'Error') return
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
      setPrevious(result === 'Error' ? null : Number(result))
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const handleEquals = () => {
    if (operator === null || waitingForOperand || display === 'Error') return
    const result = compute(previous, parseFloat(display), operator)
    setDisplay(format(result))
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
        performOperation('−')
      } else if (key === '*') {
        performOperation('×')
      } else if (key === '/') {
        e.preventDefault()
        performOperation('÷')
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault()
        handleEquals()
      } else if (key === 'Backspace') {
        backspace()
      } else if (key === 'Escape') {
        clearAll()
      } else if (key === '%') {
        percent()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const buttons = [
    { label: 'AC', type: 'fn', onClick: clearAll },
    { label: '+/−', type: 'fn', onClick: toggleSign },
    { label: '%', type: 'fn', onClick: percent },
    { label: '÷', type: 'op', onClick: () => performOperation('÷'), active: operator === '÷' && waitingForOperand },
    { label: '7', type: 'num', onClick: () => inputDigit(7) },
    { label: '8', type: 'num', onClick: () => inputDigit(8) },
    { label: '9', type: 'num', onClick: () => inputDigit(9) },
    { label: '×', type: 'op', onClick: () => performOperation('×'), active: operator === '×' && waitingForOperand },
    { label: '4', type: 'num', onClick: () => inputDigit(4) },
    { label: '5', type: 'num', onClick: () => inputDigit(5) },
    { label: '6', type: 'num', onClick: () => inputDigit(6) },
    { label: '−', type: 'op', onClick: () => performOperation('−'), active: operator === '−' && waitingForOperand },
    { label: '1', type: 'num', onClick: () => inputDigit(1) },
    { label: '2', type: 'num', onClick: () => inputDigit(2) },
    { label: '3', type: 'num', onClick: () => inputDigit(3) },
    { label: '+', type: 'op', onClick: () => performOperation('+'), active: operator === '+' && waitingForOperand },
    { label: '0', type: 'num wide', onClick: () => inputDigit(0) },
    { label: '.', type: 'num', onClick: inputDecimal },
    { label: '=', type: 'eq', onClick: handleEquals },
  ]

  const expression = previous !== null
    ? `${format(String(previous))} ${operator ?? ''}`.trim()
    : ''

  return (
    <div className="calculator">
      <div className="display">
        <div className="expression">{expression}&nbsp;</div>
        <div className="result" title={display}>{display}</div>
      </div>
      <div className="keys">
        {buttons.map((btn) => (
          <button
            key={btn.label}
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
  )
}
