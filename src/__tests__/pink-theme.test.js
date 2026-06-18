/*
agent: test-generation-agent
cli: Claude Code CLI
llm: claude-sonnet-4-6
run_id: 20260618T165357_6rwbtm
generated_at: 2026-06-18T11:28:30.747Z
*/
// KAN-27 — Calculator: Add Pink Background Theme
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')

const PINK_GRADIENT = 'linear-gradient(135deg, #831843 0%, #be185d 50%, #ec4899 100%)'

describe('KAN-27 — pink background theme (src/index.css)', () => {
  // F-1
  it('body background is the exact pink gradient', () => {
    expect(css).toContain(PINK_GRADIENT)
  })

  // F-2
  it('old indigo stops are fully removed', () => {
    expect(css).not.toContain('#1e1b4b')
    expect(css).not.toContain('#312e81')
    expect(css).not.toContain('#4338ca')
  })

  // E-1
  it('body retains min-height 100vh', () => {
    expect(css).toContain('min-height: 100vh')
  })
})
