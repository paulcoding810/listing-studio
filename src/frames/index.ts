import type { FramePlatform } from '@/types/target'

export interface FrameDef {
  id: string
  name: string
  platform: FramePlatform
  w: number
  h: number
  screen: { x: number; y: number; w: number; h: number; r: number }
  bodyRadius: number
  style: 'phone' | 'tablet' | 'browser' | 'window' | 'laptop'
  cutout?: 'island' | 'punch' | 'notch' | 'dot'
  colors: Array<{ name: string; value: string }>
  defaultColor: string
}

const phoneColors = [
  { name: 'Black', value: '#1C1C1E' },
  { name: 'Silver', value: '#E3E4E6' },
  { name: 'Natural', value: '#BDB6AA' },
  { name: 'Deep blue', value: '#2F3B52' },
  { name: 'Sage', value: '#9DAE97' },
  { name: 'Rose', value: '#E8C5C0' },
]

const chromeColors = [
  { name: 'Light', value: '#E8EAED' },
  { name: 'Dark', value: '#2B2C30' },
  { name: 'Indigo', value: '#C7D2FE' },
]

export const FRAMES: FrameDef[] = [
  {
    id: 'phone-island',
    name: 'Modern phone (island)',
    platform: 'ios',
    w: 432,
    h: 884,
    screen: { x: 18, y: 18, w: 396, h: 848, r: 52 },
    bodyRadius: 70,
    style: 'phone',
    cutout: 'island',
    colors: phoneColors,
    defaultColor: '#1C1C1E',
  },
  {
    id: 'phone-punch',
    name: 'Android phone (punch-hole)',
    platform: 'android',
    w: 424,
    h: 892,
    screen: { x: 16, y: 16, w: 392, h: 860, r: 40 },
    bodyRadius: 56,
    style: 'phone',
    cutout: 'punch',
    colors: phoneColors,
    defaultColor: '#1C1C1E',
  },
  {
    id: 'phone-flat',
    name: 'Generic phone (thin bezel)',
    platform: 'android',
    w: 412,
    h: 872,
    screen: { x: 10, y: 10, w: 392, h: 852, r: 38 },
    bodyRadius: 46,
    style: 'phone',
    colors: phoneColors,
    defaultColor: '#111111',
  },
  {
    id: 'tablet-ipad',
    name: 'Tablet (iPad style)',
    platform: 'ipad',
    w: 880,
    h: 1240,
    screen: { x: 30, y: 30, w: 820, h: 1180, r: 22 },
    bodyRadius: 52,
    style: 'tablet',
    cutout: 'dot',
    colors: phoneColors,
    defaultColor: '#2C2C2E',
  },
  {
    id: 'tablet-android',
    name: 'Android tablet',
    platform: 'android-tablet',
    w: 884,
    h: 1300,
    screen: { x: 32, y: 40, w: 820, h: 1220, r: 14 },
    bodyRadius: 40,
    style: 'tablet',
    cutout: 'dot',
    colors: phoneColors,
    defaultColor: '#1C1C1E',
  },
  {
    id: 'browser',
    name: 'Browser window',
    platform: 'browser',
    w: 1280,
    h: 848,
    screen: { x: 0, y: 88, w: 1280, h: 760, r: 0 },
    bodyRadius: 14,
    style: 'browser',
    colors: chromeColors,
    defaultColor: '#E8EAED',
  },
  {
    id: 'desktop-window',
    name: 'Desktop app window',
    platform: 'desktop',
    w: 1440,
    h: 952,
    screen: { x: 0, y: 52, w: 1440, h: 900, r: 0 },
    bodyRadius: 14,
    style: 'window',
    colors: chromeColors,
    defaultColor: '#E8EAED',
  },
  {
    id: 'laptop',
    name: 'Laptop',
    platform: 'desktop',
    w: 1700,
    h: 1040,
    screen: { x: 130, y: 36, w: 1440, h: 900, r: 6 },
    bodyRadius: 30,
    style: 'laptop',
    colors: [
      { name: 'Space gray', value: '#3A3B3F' },
      { name: 'Silver', value: '#D9DADC' },
      { name: 'Midnight', value: '#22293A' },
    ],
    defaultColor: '#3A3B3F',
  },
]

export function getFrame(id: string): FrameDef {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0]
}

export function frameForPlatform(p: FramePlatform): FrameDef {
  const map: Record<FramePlatform, string> = {
    ios: 'phone-island',
    android: 'phone-punch',
    ipad: 'tablet-ipad',
    'android-tablet': 'tablet-android',
    browser: 'browser',
    desktop: 'desktop-window',
    none: 'phone-flat',
  }
  return getFrame(map[p])
}
