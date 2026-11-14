import { createDevice, createShape, createText, shadow } from '@/lib/factory'
import { uid } from '@/lib/utils'
import { getTarget } from '@/targets'
import type { Background, Spread, Theme } from '@/types/project'
import { blob, buildSet, glow, pill, type TemplateDef } from './builder'

const theme = (colors: Theme['colors'], heading: string, body = 'Inter'): Theme => ({ colors, fonts: { heading, body } })
const bgRef = (key: keyof Theme['colors'], t: Theme): Background => ({ fill: { kind: 'solid', color: t.colors[key], ref: key } })
const grad = (angle: number, ...stops: Array<[string, keyof Theme['colors'] | undefined]>): Background => ({
  fill: { kind: 'linear', angle, stops: stops.map(([color, ref], i) => ({ offset: i / (stops.length - 1), color, ref })) },
})

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'aurora',
    name: 'Aurora Flow',
    category: 'Gradient',
    store: 'google-play',
    description: 'A continuous violet-to-pink gradient that runs across all five screens.',
    build() {
      const t = theme({ primary: '#7C3AED', secondary: '#DB2777', accent: '#F59E0B', background: '#1E1B4B', surface: '#312E81', text: '#FFFFFF', muted: '#E0E7FF' }, 'Poppins')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/phone',
            theme: t,
            seamless: true,
            background: grad(100, ['#1E1B4B', 'background'], ['#7C3AED', 'primary'], ['#DB2777', 'secondary']),
            shared: ({ W, H, count }) => [glow(t, W * 1, H * 0.35, W * 1.4, 'secondary', 0.45), glow(t, W * (count - 1.5), H * 0.7, W * 1.6, 'primary', 0.5)],
            pages: [
              { title: 'Plan your day\nin seconds', subtitle: 'Smart lists that sort themselves', screen: 'demo:tasks-list' },
              { title: 'See the week\nat a glance', subtitle: 'A calendar that actually helps', screen: 'demo:tasks-calendar' },
              { title: 'Track every\ngoal', subtitle: 'Progress you can feel', screen: 'demo:tablet-dashboard' },
              { title: 'Chat with\nyour team', subtitle: 'Comments right on the task', screen: 'demo:chat-thread' },
              { title: 'Stay in\nflow', subtitle: 'Free on Android', screen: 'demo:tasks-list', layout: 'tilt-right' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    category: 'Minimal',
    store: 'google-play',
    description: 'White space, crisp type and thin-bezel phones. Lets your UI do the talking.',
    build() {
      const t = theme({ primary: '#111827', secondary: '#6366F1', accent: '#6366F1', background: '#F8FAFC', surface: '#FFFFFF', text: '#0F172A', muted: '#64748B' }, 'Inter')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/phone',
            theme: t,
            background: bgRef('background', t),
            frameId: 'phone-flat',
            frameColor: '#E3E4E6',
            align: 'left',
            pages: [
              { title: 'Less noise.\nMore done.', subtitle: 'The calm to-do list', screen: 'demo:tasks-list' },
              { title: 'Your week,\nsimplified', subtitle: 'Time-block in one tap', screen: 'demo:tasks-calendar' },
              { title: 'Focus on\nwhat matters', subtitle: 'Built-in focus timer', screen: 'demo:learn-lesson', layout: 'bottom' },
              { title: 'Notes that\nkeep up', subtitle: 'Syncs across devices', screen: 'demo:chat-list' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Gold',
    category: 'Dark Premium',
    store: 'google-play',
    description: 'Deep black with a golden accent and soft spotlight glows.',
    build() {
      const t = theme({ primary: '#D4AF37', secondary: '#7C5CFF', accent: '#D4AF37', background: '#07070A', surface: '#15151C', text: '#FAFAF9', muted: '#A8A29E' }, 'Playfair Display')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/phone',
            theme: t,
            background: { fill: { kind: 'radial', cx: 0.5, cy: 0.15, r: 0.9, stops: [{ offset: 0, color: '#26213A' }, { offset: 1, color: '#07070A', ref: 'background' }] }, pattern: { kind: 'noise', color: '#FFFFFF', size: 10, opacity: 0.05 } },
            pages: [
              { title: 'Wealth,\nrefined', subtitle: 'Private banking in your pocket', screen: 'demo:finance-home', extra: ({ W, H }) => [glow(t, W / 2, H * 0.6, W * 1.1, 'primary', 0.25)] },
              { title: 'Every asset,\none view', subtitle: 'Real-time portfolio insight', screen: 'demo:finance-chart', extra: ({ W, H }) => [glow(t, W / 2, H * 0.6, W, 'secondary', 0.25)] },
              { title: 'Move money\ninstantly', subtitle: 'Global transfers, zero fees', screen: 'demo:finance-home', layout: 'tilt-left' },
              { title: 'Security\nfirst', subtitle: 'Biometric vault protection', screen: 'demo:finance-chart', layout: 'tilt-right' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'tilt-showcase',
    name: 'Tilt Showcase',
    category: '3D Showcase',
    store: 'google-play',
    description: 'Perspective devices that alternate direction over a seamless backdrop.',
    build() {
      const t = theme({ primary: '#06B6D4', secondary: '#3B82F6', accent: '#F472B6', background: '#0B1120', surface: '#1E293B', text: '#FFFFFF', muted: '#BAE6FD' }, 'Space Grotesk')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/phone',
            theme: t,
            seamless: true,
            background: grad(90, ['#0B1120', 'background'], ['#0E3A5B', undefined], ['#0B1120', 'background']),
            shared: ({ W, H, count }) => Array.from({ length: count }, (_, i) => glow(t, W * (i + 0.5), H * 0.62, W * 0.9, i % 2 ? 'secondary' : 'primary', 0.4)),
            pages: [
              { title: 'Talk in 3D', subtitle: 'Messaging that feels alive', screen: 'demo:chat-list', layout: 'tilt-right' },
              { title: 'Share moments', subtitle: 'Photos, voice and video', screen: 'demo:chat-thread', layout: 'tilt-left' },
              { title: 'Find your people', subtitle: 'Groups for every interest', screen: 'demo:chat-list', layout: 'duo', screen2: 'demo:chat-thread' },
              { title: 'Private by design', subtitle: 'End-to-end encrypted', screen: 'demo:chat-thread', layout: 'tilt-right' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'wealth',
    name: 'Wealth Tracker',
    category: 'Finance',
    store: 'app-store',
    description: 'Navy and green finance set with a zoom highlight on key numbers.',
    build() {
      const t = theme({ primary: '#22C55E', secondary: '#3B82F6', accent: '#22C55E', background: '#0B1020', surface: '#151B2E', text: '#F4F6FB', muted: '#8A93AD' }, 'DM Sans')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'app-store/iphone-6.9',
            theme: t,
            background: grad(180, ['#111A33', undefined], ['#0B1020', 'background']),
            pages: [
              { title: 'All your money,\none app', subtitle: 'Accounts, cards and investments', screen: 'demo:finance-home' },
              { title: 'Watch it grow', subtitle: 'Live portfolio performance', screen: 'demo:finance-chart', layout: 'zoom' },
              { title: 'Spend smarter', subtitle: 'Automatic categories and budgets', screen: 'demo:finance-home', layout: 'zoom' },
              { title: 'Invest in a tap', subtitle: 'Stocks and ETFs from $1', screen: 'demo:finance-chart', layout: 'duo', screen2: 'demo:finance-home' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'pulse',
    name: 'Pulse Fitness',
    category: 'Fitness',
    store: 'google-play',
    description: 'Bold, loud and energetic. Uppercase headlines with slanted color bands.',
    build() {
      const t = theme({ primary: '#FF5F1F', secondary: '#E0244A', accent: '#A3FF12', background: '#0A0A0A', surface: '#1C1C1E', text: '#FFFFFF', muted: '#D4D4D4' }, 'Montserrat')
      const band = (W: number, H: number) =>
        createShape('rect', t, {
          name: 'Band',
          x: -W * 0.2,
          y: H * 0.42,
          width: W * 1.4,
          height: H * 0.22,
          rotation: -12,
          cornerRadius: 0,
          fill: { kind: 'linear', angle: 90, stops: [{ offset: 0, color: t.colors.primary, ref: 'primary' }, { offset: 1, color: t.colors.secondary, ref: 'secondary' }] },
        })
      const s = buildSet({
        targetId: 'google-play/phone',
        theme: t,
        uppercase: true,
        background: bgRef('background', t),
        pages: [
          { title: 'Close\nyour rings', subtitle: 'Daily goals that stick', screen: 'demo:fitness-rings', extra: ({ W, H }) => [band(W, H)] },
          { title: 'Train\nlive', subtitle: 'Real-time heart rate and pace', screen: 'demo:fitness-workout', extra: ({ W, H }) => [band(W, H)] },
          { title: 'Beat your\nbest', subtitle: 'Weekly progress at a glance', screen: 'demo:fitness-rings', layout: 'tilt-left' },
          { title: 'Start\nfree', subtitle: '7 days of premium on us', screen: 'demo:fitness-workout', layout: 'tilt-right' },
        ],
      })
      s.pages.forEach((p) => p.layers.sort((a, b) => Number(b.name === 'Band') - Number(a.name === 'Band')))
      return { theme: t, spreads: [s] }
    },
  },
  {
    id: 'flow-panorama',
    name: 'Panorama Flow',
    category: 'Productivity',
    store: 'app-store',
    description: 'Pastel seamless backdrop with a device that bridges screens one and two.',
    build() {
      const t = theme({ primary: '#6366F1', secondary: '#F472B6', accent: '#F59E0B', background: '#EEF2FF', surface: '#FFFFFF', text: '#1E1B4B', muted: '#6B7280' }, 'Outfit')
      const target = getTarget('app-store/iphone-6.9')
      const W = target.defaultSize.w
      const H = target.defaultSize.h
      const s = buildSet({
        targetId: target.id,
        theme: t,
        seamless: true,
        background: grad(90, ['#EEF2FF', 'background'], ['#FCE7F3', undefined], ['#E0F2FE', undefined], ['#EEF2FF', 'background']),
        shared: ({ W, H }) => {
          const bridge = createDevice('phone-island', W, H, { screenAssetId: 'demo:tasks-calendar', frameColor: '#BDB6AA' })
          bridge.name = 'Bridge device'
          bridge.height = Math.round(H * 0.6)
          bridge.width = Math.round(bridge.height * (440 / 892))
          bridge.x = Math.round(W - bridge.width / 2)
          bridge.y = Math.round(H * 0.34)
          bridge.rotation = 10
          bridge.shadow = shadow({ blur: 80, offsetY: 40, opacity: 0.25 })
          return [blob(t, W * 0.6, H * 0.25, W * 0.9, 'secondary', 0.35, 40), blob(t, W * 2.4, H * 0.55, W * 1.1, 'primary', 0.25, 50), bridge]
        },
        pages: [
          { title: 'Your day,\nbeautifully planned', subtitle: 'Tasks, calendar and notes together' },
          { title: '', subtitle: '' },
          { title: 'Drag to\nreschedule', subtitle: 'Time-blocking made effortless', screen: 'demo:tasks-calendar' },
          { title: 'Never miss\na beat', subtitle: 'Gentle smart reminders', screen: 'demo:tasks-list', layout: 'tilt-left' },
          { title: 'Collaborate\nin real time', subtitle: 'Share lists with anyone', screen: 'demo:chat-thread' },
        ],
      })
      s.pages[1].layers = [
        createText(t, { preset: 'hero', name: 'Headline', text: 'Everything\nin one place', x: W * 0.3, y: H * 0.08, width: W * 0.62, fontSize: 96, align: 'left', canvasWidth: W }),
      ]
      return { theme: t, spreads: [s] }
    },
  },
  {
    id: 'social-pop',
    name: 'Social Pop',
    category: 'Social Media',
    store: 'google-play',
    description: 'Playful color blobs and chunky type for social and messaging apps.',
    build() {
      const t = theme({ primary: '#3B82F6', secondary: '#F43F5E', accent: '#FACC15', background: '#FFF7ED', surface: '#FFFFFF', text: '#111827', muted: '#4B5563' }, 'Poppins')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/phone',
            theme: t,
            background: bgRef('background', t),
            frameColor: '#111111',
            pages: [
              { title: 'Say hi to\nyour people', subtitle: 'Chats, stories and calls', screen: 'demo:chat-list', extra: ({ W, H }) => [blob(t, -W * 0.15, H * 0.35, W * 0.7, 'accent'), blob(t, W * 0.6, H * 0.6, W * 0.6, 'secondary')] },
              { title: 'Share the\ngood stuff', subtitle: 'Photos in full quality', screen: 'demo:chat-thread', extra: ({ W, H }) => [blob(t, W * 0.55, H * 0.3, W * 0.7, 'primary'), blob(t, -W * 0.1, H * 0.7, W * 0.5, 'accent')] },
              { title: 'Group chats\nthat work', subtitle: 'Polls, mentions, reactions', screen: 'demo:chat-list', layout: 'duo', screen2: 'demo:chat-thread', extra: ({ W, H }) => [blob(t, W * 0.2, H * 0.4, W * 0.8, 'secondary', 0.9)] },
              { title: 'Free.\nForever.', subtitle: 'No ads, no tracking', screen: 'demo:chat-thread', extra: ({ W, H }) => [blob(t, W * 0.1, H * 0.45, W * 0.9, 'primary', 0.9)] },
            ],
          }),
        ].map((sp) => {
          sp.pages.forEach((p) => p.layers.sort((a, b) => Number(b.name === 'Blob') - Number(a.name === 'Blob')))
          return sp
        }),
      }
    },
  },
  {
    id: 'shopfront',
    name: 'Shopfront',
    category: 'E-commerce',
    store: 'google-play',
    description: 'Warm cream palette with sale badges for shopping apps.',
    build() {
      const t = theme({ primary: '#EA580C', secondary: '#1F1308', accent: '#DC2626', background: '#FFF8F1', surface: '#FFFFFF', text: '#1F1308', muted: '#78716C' }, 'DM Sans')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/phone',
            theme: t,
            background: { fill: { kind: 'solid', color: t.colors.background, ref: 'background' }, pattern: { kind: 'dots', color: '#EA580C', size: 44, opacity: 0.12 } },
            align: 'left',
            pages: [
              { title: 'Sneakers you\nwill love', subtitle: 'New drops every Friday', screen: 'demo:shop-grid', extra: () => pill(t, 'NEW IN', 86, 70, 1) },
              { title: 'Try before\nyou buy', subtitle: 'Free returns within 30 days', screen: 'demo:shop-product', extra: () => pill(t, '-30% TODAY', 86, 70, 1, 'accent') },
              { title: 'Checkout in\none tap', subtitle: 'Saved cards and wallets', screen: 'demo:shop-product', layout: 'tilt-right' },
              { title: 'Track every\norder', subtitle: 'Live delivery updates', screen: 'demo:shop-grid', layout: 'tilt-left' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'learn-bright',
    name: 'Learn Bright',
    category: 'Education',
    store: 'app-store',
    description: 'Sunny yellow and blue with friendly rounded shapes for learning apps.',
    build() {
      const t = theme({ primary: '#2563EB', secondary: '#7C3AED', accent: '#FDE047', background: '#FEF9C3', surface: '#FFFFFF', text: '#1E293B', muted: '#475569' }, 'Outfit')
      const deco = (W: number, H: number) => [
        createShape('ellipse', t, { name: 'Sun', x: W * 0.72, y: -W * 0.12, width: W * 0.5, height: W * 0.5, fill: { kind: 'solid', color: t.colors.accent, ref: 'accent' } }),
        createShape('star', t, { name: 'Star', x: W * 0.08, y: H * 0.3, width: W * 0.12, height: W * 0.12, rotation: -12, fill: { kind: 'solid', color: t.colors.primary, ref: 'primary' } }),
      ]
      const s = buildSet({
        targetId: 'app-store/iphone-6.9',
        theme: t,
        background: bgRef('background', t),
        pages: [
          { title: 'Learn a little\nevery day', subtitle: '5-minute lessons that stick', screen: 'demo:learn-courses', extra: ({ W, H }) => deco(W, H) },
          { title: 'Practice\nmakes perfect', subtitle: 'Interactive quizzes', screen: 'demo:learn-lesson', layout: 'zoom', extra: ({ W, H }) => deco(W, H) },
          { title: 'Keep your\nstreak alive', subtitle: 'Fun reminders and rewards', screen: 'demo:learn-courses', layout: 'tilt-left' },
          { title: '40+ subjects\nto explore', subtitle: 'Languages, coding, art and more', screen: 'demo:learn-lesson', layout: 'tilt-right' },
        ],
      })
      s.pages.forEach((p) => p.layers.sort((a, b) => Number(['Sun', 'Star'].includes(b.name)) - Number(['Sun', 'Star'].includes(a.name))))
      return { theme: t, spreads: [s] }
    },
  },
  {
    id: 'feature-banner',
    name: 'Feature Banner',
    category: 'Gradient',
    store: 'google-play',
    description: 'Google Play feature graphic: headline left, tilted phone right.',
    build() {
      const t = theme({ primary: '#6366F1', secondary: '#EC4899', accent: '#F59E0B', background: '#1E1B4B', surface: '#312E81', text: '#FFFFFF', muted: '#E0E7FF' }, 'Poppins')
      const W = 1024
      const H = 500
      const device = createDevice('phone-punch', W, H, { screenAssetId: 'demo:tasks-list', perspective: { preset: 'right', rotateX: 0, rotateY: -34, depth: 1.5 } })
      device.height = 560
      device.width = Math.round(560 * (432 / 900))
      device.x = 640
      device.y = 40
      device.shadow = shadow({ blur: 40, offsetY: 20 })
      const spread: Spread = {
        id: uid(),
        name: 'Feature graphic',
        targetId: 'google-play/feature-graphic',
        width: W,
        height: H,
        seamless: false,
        background: grad(120, ['#1E1B4B', 'background'], ['#6366F1', 'primary'], ['#EC4899', 'secondary']),
        sharedLayers: [],
        pages: [
          {
            id: uid(),
            name: 'Feature graphic',
            layers: [
              glow(t, 820, 260, 700, 'secondary', 0.4),
              createText(t, { preset: 'hero', name: 'Headline', text: 'Plan less.\nDo more.', x: 64, y: 120, width: 520, fontSize: 76, align: 'left', canvasWidth: W }),
              createText(t, { preset: 'subtitle', name: 'Subtitle', text: 'The to-do list that plans your day for you.', x: 64, y: 320, width: 480, fontSize: 26, align: 'left', color: t.colors.muted, colorRef: 'muted', canvasWidth: W }),
              device,
            ],
          },
        ],
      }
      return { theme: t, spreads: [spread] }
    },
  },
  {
    id: 'extension-hero',
    name: 'Extension Hero',
    category: 'Browser Extension',
    store: 'chrome-web-store',
    description: 'Chrome Web Store kit: three screenshots, small promo tile and marquee.',
    build() {
      const t = theme({ primary: '#6366F1', secondary: '#8B5CF6', accent: '#FACC15', background: '#EEF2FF', surface: '#FFFFFF', text: '#1E1B4B', muted: '#4B5563' }, 'Inter')
      const shots = buildSet({
        targetId: 'chrome-web-store/screenshot',
        theme: t,
        background: grad(135, ['#EEF2FF', 'background'], ['#E0E7FF', undefined]),
        titleScale: 0.9,
        pages: [
          { title: 'Highlight anything on the web', screen: 'demo:browser-page' },
          { title: 'Save quotes in one click', screen: 'demo:browser-page', layout: 'zoom' },
          { title: 'Export notes anywhere', screen: 'demo:browser-page', layout: 'tilt-right' },
        ],
      })
      const tile = (targetId: string, W: number, H: number, big: boolean): Spread => ({
        id: uid(),
        name: getTarget(targetId).label,
        targetId,
        width: W,
        height: H,
        seamless: false,
        background: grad(135, ['#6366F1', 'primary'], ['#8B5CF6', 'secondary']),
        sharedLayers: [],
        pages: [
          {
            id: uid(),
            name: getTarget(targetId).label,
            layers: [
              createShape('rect', t, { name: 'Icon', x: W * 0.08, y: H / 2 - H * 0.18, width: H * 0.36, height: H * 0.36, cornerRadius: H * 0.09, fill: { kind: 'solid', color: '#FFFFFF' } }),
              createShape('rect', t, { name: 'Icon mark', x: W * 0.08 + H * 0.09, y: H / 2 - H * 0.04, width: H * 0.18, height: H * 0.08, cornerRadius: H * 0.02, fill: { kind: 'solid', color: t.colors.accent, ref: 'accent' } }),
              createText(t, { preset: 'hero', name: 'Name', text: 'Highlight', x: W * 0.08 + H * 0.46, y: H / 2 - (big ? 70 : 34), width: W * 0.6, fontSize: big ? 84 : 40, align: 'left', color: '#FFFFFF', colorRef: undefined, canvasWidth: W }),
              createText(t, { preset: 'subtitle', name: 'Tagline', text: 'Save the best of the web', x: W * 0.08 + H * 0.46, y: H / 2 + (big ? 30 : 12), width: W * 0.6, fontSize: big ? 36 : 18, align: 'left', color: '#E0E7FF', colorRef: undefined, canvasWidth: W }),
            ],
          },
        ],
      })
      return { theme: t, spreads: [shots, tile('chrome-web-store/small-promo', 440, 280, false), tile('chrome-web-store/marquee', 1400, 560, true)] }
    },
  },
  {
    id: 'tablet-pro',
    name: 'Tablet Pro',
    category: 'Productivity',
    store: 'google-play',
    description: '10-inch tablet screenshots for dashboards and productivity apps.',
    build() {
      const t = theme({ primary: '#6366F1', secondary: '#10B981', accent: '#F59E0B', background: '#0F172A', surface: '#1E293B', text: '#F8FAFC', muted: '#94A3B8' }, 'Inter')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'google-play/tablet-10',
            theme: t,
            background: grad(160, ['#0F172A', 'background'], ['#1E1B4B', undefined]),
            pages: [
              { title: 'Your business\nat a glance', subtitle: 'Live dashboards on the big screen', screen: 'demo:tablet-dashboard' },
              { title: 'Dig into\nevery metric', subtitle: 'Tap any chart to drill down', screen: 'demo:tablet-dashboard', layout: 'zoom' },
              { title: 'Present\nwith confidence', subtitle: 'Share-ready reports', screen: 'demo:tablet-dashboard', layout: 'tilt-right' },
            ],
          }),
        ],
      }
    },
  },
  {
    id: 'mac-launch',
    name: 'Mac Launch',
    category: 'Desktop App',
    store: 'mac-app-store',
    description: 'Laptop mockups for Mac App Store and desktop apps.',
    build() {
      const t = theme({ primary: '#8B5CF6', secondary: '#0EA5E9', accent: '#F472B6', background: '#F5F3FF', surface: '#FFFFFF', text: '#18181B', muted: '#52525B' }, 'Playfair Display')
      return {
        theme: t,
        spreads: [
          buildSet({
            targetId: 'mac-app-store/screenshot',
            theme: t,
            frameId: 'laptop',
            seamless: true,
            background: grad(90, ['#F5F3FF', 'background'], ['#E0F2FE', undefined], ['#FCE7F3', undefined]),
            titleScale: 1.3,
            pages: [
              { title: 'Write without distraction', subtitle: 'A calm home for your ideas', screen: 'demo:desktop-notes' },
              { title: 'Organize everything', subtitle: 'Folders, tags and smart lists', screen: 'demo:desktop-notes', layout: 'zoom' },
              { title: 'Ship your best work', subtitle: 'Export to PDF, Markdown and more', screen: 'demo:desktop-notes', layout: 'tilt-left' },
            ],
          }),
        ],
      }
    },
  },
]

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id)
