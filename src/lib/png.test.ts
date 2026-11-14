import { describe, expect, it } from 'vitest'
import { rgbScanlines } from './png'

describe('rgbScanlines', () => {
  it('drops alpha and prefixes each row with filter byte 0', () => {
    const rgba = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255, 7, 8, 9, 255, 10, 11, 12, 255])
    expect([...rgbScanlines(rgba, 2, 2)]).toEqual([0, 1, 2, 3, 4, 5, 6, 0, 7, 8, 9, 10, 11, 12])
  })
})
