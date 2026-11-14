import { describe, expect, it } from 'vitest'
import { createBlankProject } from './factory'
import { lintProject } from './lint'
import type { DeviceLayer, TextLayer } from '@/types/project'

describe('lintProject', () => {
  it('flags empty frames and placeholder text on a blank project', () => {
    const p = createBlankProject('t', 'google-play/phone', 2)
    const msgs = lintProject(p).map((w) => w.message)
    expect(msgs.filter((m) => m.includes('no screenshot'))).toHaveLength(2)
    expect(msgs.filter((m) => m.includes('Placeholder'))).toHaveLength(2)
  })

  it('is clean once content is filled in, and flags missing translations', () => {
    const p = createBlankProject('t', 'google-play/phone', 1)
    const [text, device] = p.spreads[0].pages[0].layers as [TextLayer, DeviceLayer]
    text.text = 'Budget smarter'
    device.screenAssetId = 'demo:finance-home'
    expect(lintProject(p)).toEqual([])
    p.locales.push('de-DE')
    expect(lintProject(p).map((w) => w.message)).toEqual(['“Budget smarter” is not translated (de-DE)'])
    p.strings['de-DE'] = { [text.id]: 'Klüger budgetieren' }
    expect(lintProject(p)).toEqual([])
  })

  it('uses per-language screenshots when checking frames', () => {
    const p = createBlankProject('t', 'google-play/phone', 1)
    const [text, device] = p.spreads[0].pages[0].layers as [TextLayer, DeviceLayer]
    text.text = 'Hi'
    text.localizable = false
    p.locales.push('de-DE')
    p.overrides = { 'de-DE': { [device.id]: { screenAssetId: 'demo:finance-chart' } } }
    expect(lintProject(p).map((w) => w.message)).toEqual([`“${device.name}” has no screenshot`])
  })
})
