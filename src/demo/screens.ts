import { Kit } from './kit'

export interface DemoScreen {
  id: string
  name: string
  app: string
  w: number
  h: number
  paint: (k: Kit) => void
}

const PHONE = { w: 390, h: 844 }
const SCALE = 2

const finance = { bg: '#0B1020', card: '#151B2E', text: '#F4F6FB', muted: '#8A93AD', green: '#22C55E', accent: '#6366F1' }

const screens: DemoScreen[] = [
  {
    id: 'demo:finance-home',
    name: 'Wallet home',
    app: 'Finance',
    ...PHONE,
    paint(k) {
      const t = finance
      k.fill(t.bg)
      k.statusBar(t.text)
      k.text('Good morning,', 24, 88, { size: 15, color: t.muted })
      k.text('Alex Morgan', 24, 114, { size: 24, weight: 700, color: t.text })
      k.avatar(340, 98, 22, '#F59E0B', 'AM')
      k.rr(24, 140, 342, 196, 28, k.lin(24, 140, 366, 336, ['#6366F1', '#8B5CF6', '#EC4899']))
      k.text('Total balance', 48, 184, { size: 14, color: 'rgba(255,255,255,0.75)' })
      k.text('$24,580.32', 48, 230, { size: 38, weight: 800, color: '#fff' })
      k.rr(48, 252, 96, 28, 14, 'rgba(255,255,255,0.2)')
      k.text('▲ 4.6%', 96, 271, { size: 13, weight: 600, color: '#fff', align: 'center' })
      k.text('•••• 4092', 342, 312, { size: 14, weight: 600, color: 'rgba(255,255,255,0.85)', align: 'right' })
      const actions = ['Send', 'Receive', 'Swap', 'More']
      actions.forEach((a, i) => {
        const cx = 24 + 43 + i * 86
        k.circle(cx, 386, 28, t.card)
        k.rr(cx - 9, 377, 18, 18, 5, i === 0 ? t.accent : '#2A3350')
        k.text(a, cx, 436, { size: 13, color: t.muted, align: 'center' })
      })
      k.text('Recent activity', 24, 488, { size: 18, weight: 700, color: t.text })
      k.text('See all', 366, 488, { size: 14, color: t.accent, align: 'right' })
      const tx = [
        ['Spotify', 'Subscription', '-$11.99', '#1DB954'],
        ['Salary', 'Acme Inc.', '+$4,200.00', '#6366F1'],
        ['Whole Foods', 'Groceries', '-$84.20', '#F97316'],
        ['Uber', 'Transport', '-$18.40', '#0EA5E9'],
      ]
      tx.forEach(([n, s, v, c], i) => {
        const y = 512 + i * 72
        k.rr(24, y, 342, 60, 18, t.card)
        k.rr(38, y + 12, 36, 36, 11, c)
        k.text(n, 88, y + 27, { size: 15, weight: 600, color: t.text })
        k.text(s, 88, y + 46, { size: 12, color: t.muted })
        k.text(v, 352, y + 36, { size: 15, weight: 700, color: v.startsWith('+') ? t.green : t.text, align: 'right' })
      })
      k.tabBar(780, 4, 0, '#0E1427', t.accent, '#3A4566')
    },
  },
  {
    id: 'demo:finance-chart',
    name: 'Portfolio chart',
    app: 'Finance',
    ...PHONE,
    paint(k) {
      const t = finance
      k.fill(t.bg)
      k.statusBar(t.text)
      k.text('Portfolio', 24, 100, { size: 28, weight: 800, color: t.text })
      k.text('$128,942.10', 24, 150, { size: 34, weight: 800, color: t.text })
      k.text('+$3,284.22 (2.61%) today', 24, 178, { size: 14, weight: 600, color: t.green })
      const vals = k.wave(40, 7, 0.25, 0.92)
      const pts = vals.map((v, i) => [24 + (i * 342) / 39, 230 + 210 * (1 - v)] as [number, number])
      k.area(pts, 440, k.lin(0, 230, 0, 440, ['rgba(34,197,94,0.35)', 'rgba(34,197,94,0)']))
      k.linePath(pts, t.green, 3)
      const last = pts[28]
      k.circle(last[0], last[1], 8, 'rgba(34,197,94,0.3)')
      k.circle(last[0], last[1], 4.5, t.green)
      ;['1D', '1W', '1M', '3M', '1Y', 'All'].forEach((p, i) => {
        const x = 24 + i * 58
        if (i === 2) k.rr(x, 462, 50, 32, 16, t.card)
        k.text(p, x + 25, 484, { size: 13, weight: 600, color: i === 2 ? t.text : t.muted, align: 'center' })
      })
      k.text('Holdings', 24, 540, { size: 18, weight: 700, color: t.text })
      const h = [
        ['AAPL', 'Apple', '$42,180', '+1.2%', '#A3A3A3'],
        ['NVDA', 'Nvidia', '$31,904', '+4.8%', '#76B900'],
        ['VTI', 'Total Market', '$28,412', '+0.6%', '#B91C1C'],
      ]
      h.forEach(([sym, name, val, ch, c], i) => {
        const y = 562 + i * 72
        k.rr(24, y, 342, 60, 18, t.card)
        k.rr(38, y + 12, 36, 36, 18, c)
        k.text(sym, 88, y + 27, { size: 15, weight: 700, color: t.text })
        k.text(name, 88, y + 46, { size: 12, color: t.muted })
        const sp = k.wave(10, i + 3, 0.2, 0.9).map((v, j) => [210 + j * 7, y + 18 + 24 * (1 - v)] as [number, number])
        k.linePath(sp, t.green, 2)
        k.text(val, 352, y + 27, { size: 15, weight: 700, color: t.text, align: 'right' })
        k.text(ch, 352, y + 46, { size: 12, weight: 600, color: t.green, align: 'right' })
      })
      k.tabBar(780, 4, 1, '#0E1427', t.accent, '#3A4566')
    },
  },
  {
    id: 'demo:fitness-rings',
    name: 'Activity rings',
    app: 'Fitness',
    ...PHONE,
    paint(k) {
      k.fill('#0A0A0A')
      k.statusBar('#fff')
      k.text('Today', 24, 100, { size: 30, weight: 800, color: '#fff' })
      k.text('Thursday, 14 Nov', 24, 126, { size: 14, color: '#8E8E93' })
      k.ring(195, 290, 120, 26, 0.82, '#FF2D55', '#3A0D16')
      k.ring(195, 290, 90, 26, 0.64, '#A3FF12', '#1F3304')
      k.ring(195, 290, 60, 26, 0.91, '#18D8F5', '#06303A')
      const stats = [
        ['Move', '642', '/780 kcal', '#FF2D55'],
        ['Exercise', '38', '/60 min', '#A3FF12'],
        ['Stand', '11', '/12 hrs', '#18D8F5'],
      ]
      stats.forEach(([l, v, u, c], i) => {
        const x = 24 + i * 118
        k.rr(x, 448, 106, 104, 20, '#1C1C1E')
        k.text(l, x + 14, 476, { size: 13, weight: 600, color: c })
        k.text(v, x + 14, 514, { size: 28, weight: 800, color: '#fff' })
        k.text(u, x + 14, 538, { size: 11, color: '#8E8E93' })
      })
      k.rr(24, 568, 342, 190, 22, '#1C1C1E')
      k.text('This week', 44, 602, { size: 16, weight: 700, color: '#fff' })
      k.text('4,812 kcal', 346, 602, { size: 14, weight: 600, color: '#FF2D55', align: 'right' })
      k.bars(40, 622, 310, 100, [0.5, 0.72, 0.38, 0.9, 0.66, 0.8, 0.45], '#FF2D55', '#2C2C2E', 3)
      ;['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => k.text(d, 40 + 22 + i * 44.3, 744, { size: 12, color: '#8E8E93', align: 'center' }))
      k.tabBar(780, 4, 0, '#111', '#A3FF12', '#3A3A3C')
    },
  },
  {
    id: 'demo:fitness-workout',
    name: 'Live workout',
    app: 'Fitness',
    ...PHONE,
    paint(k) {
      k.fill(k.lin(0, 0, 0, 844, ['#FF5F1F', '#B8154A']))
      k.statusBar('#fff')
      k.text('OUTDOOR RUN', 195, 100, { size: 14, weight: 700, color: 'rgba(255,255,255,0.8)', align: 'center' })
      k.text('32:18', 195, 210, { size: 92, weight: 800, color: '#fff', align: 'center' })
      k.text('Duration', 195, 242, { size: 15, color: 'rgba(255,255,255,0.8)', align: 'center' })
      const s = [
        ['5.42', 'km'],
        ['5\'56"', 'avg pace'],
        ['148', 'bpm'],
        ['412', 'kcal'],
      ]
      s.forEach(([v, l], i) => {
        const x = 24 + (i % 2) * 175
        const y = 280 + Math.floor(i / 2) * 116
        k.rr(x, y, 167, 104, 24, 'rgba(255,255,255,0.16)')
        k.text(v, x + 20, y + 56, { size: 34, weight: 800, color: '#fff' })
        k.text(l, x + 20, y + 84, { size: 14, color: 'rgba(255,255,255,0.8)' })
      })
      k.rr(24, 520, 342, 150, 24, 'rgba(0,0,0,0.22)')
      k.text('Heart rate', 44, 556, { size: 15, weight: 700, color: '#fff' })
      const hr = k.wave(36, 11, 0.3, 0.95).map((v, i) => [44 + i * 8.7, 580 + 70 * (1 - v)] as [number, number])
      k.linePath(hr, '#fff', 3)
      k.circle(130, 740, 38, 'rgba(255,255,255,0.22)')
      k.rr(118, 724, 8, 32, 3, '#fff')
      k.rr(134, 724, 8, 32, 3, '#fff')
      k.circle(260, 740, 38, '#fff')
      k.rr(246, 726, 28, 28, 6, '#E0244A')
    },
  },
  {
    id: 'demo:tasks-list',
    name: 'Today tasks',
    app: 'Productivity',
    ...PHONE,
    paint(k) {
      k.fill('#F7F7FB')
      k.statusBar('#111')
      k.text('Today', 24, 104, { size: 32, weight: 800, color: '#111827' })
      k.text('6 of 9 tasks done', 24, 132, { size: 14, color: '#6B7280' })
      k.rr(24, 148, 342, 10, 5, '#E5E7EB')
      k.rr(24, 148, 228, 10, 5, k.lin(24, 0, 252, 0, ['#8B5CF6', '#6366F1']))
      const tasks: Array<[string, string, string, boolean]> = [
        ['Design review with team', '10:00 · Work', '#8B5CF6', true],
        ['Send invoice to Northwind', '11:30 · Finance', '#10B981', true],
        ['Gym — leg day', '13:00 · Health', '#F59E0B', true],
        ['Draft Q4 roadmap', '15:00 · Work', '#8B5CF6', false],
        ['Call mom', '18:00 · Personal', '#EC4899', false],
        ['Read 20 pages', '21:00 · Growth', '#0EA5E9', false],
      ]
      tasks.forEach(([n, m, c, done], i) => {
        const y = 186 + i * 86
        k.rr(24, y, 342, 72, 20, '#fff')
        if (done) k.circle(56, y + 36, 13, c)
        else {
          k.c.beginPath()
          k.c.arc(56, y + 36, 12, 0, Math.PI * 2)
          k.c.lineWidth = 2.5
          k.c.strokeStyle = '#D1D5DB'
          k.c.stroke()
        }
        if (done) k.linePath([[50, y + 36], [55, y + 41], [63, y + 31]], '#fff', 2.5)
        k.text(n, 84, y + 32, { size: 15, weight: 600, color: done ? '#9CA3AF' : '#111827' })
        k.text(m, 84, y + 52, { size: 12, color: '#9CA3AF' })
        k.rr(346, y + 26, 6, 20, 3, c)
      })
      k.circle(330, 730, 30, '#6366F1')
      k.rr(328, 716, 4, 28, 2, '#fff')
      k.rr(316, 728, 28, 4, 2, '#fff')
      k.tabBar(780, 4, 0, '#fff', '#6366F1', '#D1D5DB')
    },
  },
  {
    id: 'demo:tasks-calendar',
    name: 'Calendar timeline',
    app: 'Productivity',
    ...PHONE,
    paint(k) {
      k.fill('#FFFFFF')
      k.statusBar('#111')
      k.text('November', 24, 100, { size: 28, weight: 800, color: '#111827' })
      ;['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => {
        const x = 24 + i * 49
        const on = i === 3
        if (on) k.rr(x, 120, 44, 64, 16, '#6366F1')
        k.text(d, x + 22, 144, { size: 12, color: on ? '#E0E7FF' : '#9CA3AF', align: 'center' })
        k.text(String(11 + i), x + 22, 170, { size: 17, weight: 700, color: on ? '#fff' : '#111827', align: 'center' })
      })
      for (let i = 0; i < 8; i++) {
        const y = 220 + i * 66
        k.text(`${9 + i}:00`, 24, y + 5, { size: 12, color: '#9CA3AF' })
        k.rr(76, y, 290, 1, 0, '#F3F4F6')
      }
      const ev: Array<[number, number, string, string, string]> = [
        [0.3, 1.4, 'Standup', '#EEF2FF', '#4F46E5'],
        [2, 1.6, 'Design review', '#FEF3C7', '#B45309'],
        [4, 1, 'Lunch with Sam', '#DCFCE7', '#15803D'],
        [5.3, 2, 'Deep work: roadmap', '#FCE7F3', '#BE185D'],
      ]
      ev.forEach(([s, d, n, bg, fg]) => {
        const y = 220 + s * 66
        k.rr(84, y + 4, 282, d * 66 - 8, 14, bg)
        k.rr(84, y + 4, 5, d * 66 - 8, 2.5, fg)
        k.text(n, 102, y + 30, { size: 14, weight: 700, color: fg })
        k.text(`${Math.floor(9 + s)}:${s % 1 ? '30' : '00'}`, 102, y + 50, { size: 12, color: fg })
      })
      k.tabBar(780, 4, 1, '#fff', '#6366F1', '#D1D5DB')
    },
  },
  {
    id: 'demo:chat-list',
    name: 'Chats',
    app: 'Social',
    ...PHONE,
    paint(k) {
      k.fill('#FFFFFF')
      k.statusBar('#111')
      k.text('Chats', 24, 100, { size: 30, weight: 800, color: '#111' })
      k.rr(24, 118, 342, 42, 14, '#F2F3F5')
      k.text('Search', 52, 145, { size: 15, color: '#9CA3AF' })
      const colors = ['#F43F5E', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
      const names = ['Mia', 'Leo', 'Ava', 'Kai', 'Zoe']
      names.forEach((n, i) => {
        const cx = 56 + i * 72
        k.circle(cx, 210, 30, k.lin(cx - 30, 180, cx + 30, 240, ['#F97316', '#EC4899', '#8B5CF6']))
        k.circle(cx, 210, 27, '#fff')
        k.avatar(cx, 210, 24, colors[i], n[0])
        k.text(n, cx, 260, { size: 12, color: '#374151', align: 'center' })
      })
      const chats = [
        ['Mia Chen', 'Sending the photos now 📸', '2m', 2],
        ['Weekend trip', 'Leo: I booked the cabin!', '14m', 5],
        ['Ava Patel', 'Haha that is perfect', '1h', 0],
        ['Kai Müller', 'See you at 7?', '3h', 1],
        ['Design team', 'Zoe: New mocks are up', 'Tue', 0],
        ['Noah Kim', 'Thanks for yesterday 🙏', 'Mon', 0],
      ] as const
      chats.forEach(([n, m, t, u], i) => {
        const y = 290 + i * 78
        k.avatar(52, y + 32, 26, colors[i % colors.length], n[0])
        k.text(n, 92, y + 26, { size: 16, weight: 700, color: '#111' })
        k.text(m, 92, y + 48, { size: 14, color: u ? '#111' : '#6B7280', weight: u ? 600 : 400 })
        k.text(t, 366, y + 26, { size: 12, color: '#9CA3AF', align: 'right' })
        if (u) {
          k.circle(354, y + 44, 11, '#3B82F6')
          k.text(String(u), 354, y + 48.5, { size: 12, weight: 700, color: '#fff', align: 'center' })
        }
      })
      k.tabBar(780, 4, 1, '#fff', '#3B82F6', '#D1D5DB')
    },
  },
  {
    id: 'demo:chat-thread',
    name: 'Conversation',
    app: 'Social',
    ...PHONE,
    paint(k) {
      k.fill('#F4F5FA')
      k.c.fillStyle = '#fff'
      k.c.fillRect(0, 0, 390, 120)
      k.statusBar('#111')
      k.avatar(60, 86, 20, '#F43F5E', 'M')
      k.text('Mia Chen', 92, 82, { size: 16, weight: 700, color: '#111' })
      k.text('online', 92, 100, { size: 12, color: '#10B981' })
      const msgs: Array<[boolean, string[]]> = [
        [false, ['Are we still on for', 'Saturday? ☀️']],
        [true, ['Yes! I found a great', 'hiking trail near the lake']],
        [false, ['Send pics!!']],
        [true, ['Here is the view from', 'the top last time 🏔️']],
      ]
      let y = 150
      msgs.forEach(([me, lines]) => {
        const h = 22 + lines.length * 21
        const w = 236
        const x = me ? 366 - w : 24
        k.rr(x, y, w, h, 20, me ? k.lin(x, y, x + w, y + h, ['#6366F1', '#8B5CF6']) : '#fff')
        lines.forEach((l, i) => k.text(l, x + 16, y + 30 + i * 21, { size: 15, color: me ? '#fff' : '#111' }))
        y += h + 12
      })
      k.rr(130, y, 236, 180, 20, k.lin(130, y, 366, y + 180, ['#0EA5E9', '#22C55E']))
      k.c.beginPath()
      k.c.moveTo(130, y + 180)
      k.c.lineTo(200, y + 90)
      k.c.lineTo(250, y + 140)
      k.c.lineTo(300, y + 70)
      k.c.lineTo(366, y + 180)
      k.c.fillStyle = 'rgba(15,23,42,0.45)'
      k.c.fill()
      k.circle(320, y + 40, 16, '#FDE68A')
      k.rr(16, 764, 358, 52, 26, '#fff')
      k.text('Message', 40, 796, { size: 15, color: '#9CA3AF' })
      k.circle(348, 790, 18, '#6366F1')
    },
  },
  {
    id: 'demo:shop-grid',
    name: 'Shop catalog',
    app: 'E-commerce',
    ...PHONE,
    paint(k) {
      k.fill('#FFF8F1')
      k.statusBar('#1F1308')
      k.text('Discover', 24, 100, { size: 30, weight: 800, color: '#1F1308' })
      k.rr(24, 118, 342, 44, 22, '#fff')
      k.text('Search sneakers, bags…', 52, 146, { size: 14, color: '#A8A29E' })
      ;['All', 'Shoes', 'Bags', 'Watches', 'Hats'].forEach((c, i) => {
        const x = 24 + i * 76
        k.rr(x, 178, 68, 34, 17, i === 1 ? '#1F1308' : '#fff')
        k.text(c, x + 34, 200, { size: 13, weight: 600, color: i === 1 ? '#fff' : '#57534E', align: 'center' })
      })
      const items = [
        ['Air Glide', '$129', '#FDBA74', '#EA580C'],
        ['Court Low', '$98', '#A5B4FC', '#4F46E5'],
        ['Trail Max', '$149', '#86EFAC', '#16A34A'],
        ['Street 2', '$89', '#F9A8D4', '#DB2777'],
      ]
      items.forEach(([n, p, bg, fg], i) => {
        const x = 24 + (i % 2) * 175
        const y = 230 + Math.floor(i / 2) * 262
        k.rr(x, y, 167, 250, 24, '#fff')
        k.rr(x + 10, y + 10, 147, 150, 18, bg)
        k.c.save()
        k.c.translate(x + 83, y + 92)
        k.c.rotate(-0.25)
        k.rr(-52, -14, 104, 40, 20, fg)
        k.rr(-52, 14, 112, 12, 6, '#fff')
        k.c.restore()
        k.circle(x + 140, y + 30, 13, 'rgba(255,255,255,0.8)')
        k.text(n, x + 14, y + 190, { size: 15, weight: 700, color: '#1F1308' })
        k.text(p, x + 14, y + 216, { size: 16, weight: 800, color: '#EA580C' })
        k.text('★ 4.8', x + 152, y + 216, { size: 12, color: '#78716C', align: 'right' })
      })
      k.tabBar(780, 4, 0, '#fff', '#EA580C', '#D6D3D1')
    },
  },
  {
    id: 'demo:shop-product',
    name: 'Product detail',
    app: 'E-commerce',
    ...PHONE,
    paint(k) {
      k.fill('#FFF8F1')
      k.rr(0, 0, 390, 430, 0, k.lin(0, 0, 390, 430, ['#FED7AA', '#FDBA74']))
      k.statusBar('#1F1308')
      k.c.save()
      k.c.translate(195, 250)
      k.c.rotate(-0.3)
      k.rr(-130, -40, 260, 96, 48, '#EA580C')
      k.rr(-130, 30, 280, 28, 14, '#fff')
      k.rr(-60, -30, 90, 20, 10, '#9A3412')
      k.c.restore()
      ;[0, 1, 2].forEach((i) => k.circle(175 + i * 20, 400, i === 0 ? 5 : 4, i === 0 ? '#1F1308' : 'rgba(31,19,8,0.3)'))
      k.text('Air Glide Runner', 24, 478, { size: 26, weight: 800, color: '#1F1308' })
      k.text('★★★★★  4.8 (2,104 reviews)', 24, 506, { size: 14, color: '#78716C' })
      k.text('$129', 366, 478, { size: 26, weight: 800, color: '#EA580C', align: 'right' })
      k.text('Size', 24, 552, { size: 15, weight: 700, color: '#1F1308' })
      ;['7', '8', '9', '10', '11'].forEach((s, i) => {
        const x = 24 + i * 66
        k.rr(x, 566, 56, 48, 14, i === 2 ? '#1F1308' : '#fff')
        k.text(s, x + 28, 596, { size: 16, weight: 700, color: i === 2 ? '#fff' : '#1F1308', align: 'center' })
      })
      k.text('Color', 24, 652, { size: 15, weight: 700, color: '#1F1308' })
      ;['#EA580C', '#4F46E5', '#16A34A', '#111'].forEach((c, i) => k.circle(42 + i * 44, 682, 15, c))
      k.rr(24, 730, 342, 60, 30, '#1F1308')
      k.text('Add to bag', 195, 767, { size: 17, weight: 700, color: '#fff', align: 'center' })
    },
  },
  {
    id: 'demo:learn-courses',
    name: 'Courses',
    app: 'Education',
    ...PHONE,
    paint(k) {
      k.fill('#FFFBEA')
      k.statusBar('#1E293B')
      k.text('Hi, Sam 👋', 24, 100, { size: 26, weight: 800, color: '#1E293B' })
      k.text('Let’s keep your 12-day streak!', 24, 126, { size: 14, color: '#64748B' })
      k.rr(24, 148, 342, 170, 26, k.lin(24, 148, 366, 318, ['#2563EB', '#7C3AED']))
      k.text('CONTINUE', 48, 184, { size: 12, weight: 700, color: 'rgba(255,255,255,0.7)' })
      k.text('Spanish for Travel', 48, 216, { size: 22, weight: 800, color: '#fff' })
      k.text('Unit 4 · Ordering food', 48, 240, { size: 14, color: 'rgba(255,255,255,0.85)' })
      k.rr(48, 266, 200, 10, 5, 'rgba(255,255,255,0.25)')
      k.rr(48, 266, 136, 10, 5, '#FDE047')
      k.circle(318, 270, 26, '#FDE047')
      k.c.beginPath()
      k.c.moveTo(312, 258)
      k.c.lineTo(328, 270)
      k.c.lineTo(312, 282)
      k.c.fillStyle = '#1E293B'
      k.c.fill()
      k.text('Popular courses', 24, 362, { size: 18, weight: 800, color: '#1E293B' })
      const cs = [
        ['Python Basics', '24 lessons', '#22C55E'],
        ['Drawing 101', '18 lessons', '#F97316'],
        ['Music Theory', '30 lessons', '#EC4899'],
        ['Astronomy', '12 lessons', '#0EA5E9'],
      ]
      cs.forEach(([n, l, c], i) => {
        const x = 24 + (i % 2) * 175
        const y = 382 + Math.floor(i / 2) * 186
        k.rr(x, y, 167, 172, 24, '#fff')
        k.rr(x + 12, y + 12, 143, 88, 18, c)
        k.circle(x + 120, y + 44, 22, 'rgba(255,255,255,0.35)')
        k.rr(x + 30, y + 52, 40, 30, 8, 'rgba(255,255,255,0.6)')
        k.text(n, x + 16, y + 130, { size: 15, weight: 700, color: '#1E293B' })
        k.text(l, x + 16, y + 152, { size: 12, color: '#64748B' })
      })
      k.tabBar(780, 4, 0, '#fff', '#2563EB', '#CBD5E1')
    },
  },
  {
    id: 'demo:learn-lesson',
    name: 'Lesson quiz',
    app: 'Education',
    ...PHONE,
    paint(k) {
      k.fill('#FFFFFF')
      k.statusBar('#1E293B')
      k.rr(24, 70, 300, 14, 7, '#E2E8F0')
      k.rr(24, 70, 190, 14, 7, '#22C55E')
      k.text('❤ 5', 366, 84, { size: 16, weight: 700, color: '#EF4444', align: 'right' })
      k.text('Translate this sentence', 24, 140, { size: 22, weight: 800, color: '#1E293B' })
      k.rr(24, 166, 342, 120, 22, '#F1F5F9')
      k.circle(70, 226, 30, '#FDE047')
      k.text('¿Dónde está la estación', 112, 218, { size: 17, weight: 600, color: '#1E293B' })
      k.text('de tren?', 112, 242, { size: 17, weight: 600, color: '#1E293B' })
      k.rr(24, 310, 342, 1.5, 0, '#E2E8F0')
      k.rr(24, 380, 342, 1.5, 0, '#E2E8F0')
      const chosen = ['Where', 'is', 'the', 'train']
      let x = 24
      chosen.forEach((w) => {
        const ww = w.length * 10 + 30
        k.rr(x, 326, ww, 42, 12, '#fff', '#CBD5E1')
        k.text(w, x + ww / 2, 353, { size: 16, weight: 600, color: '#1E293B', align: 'center' })
        x += ww + 8
      })
      const bank = ['station', 'bus', 'here', 'hotel', 'ticket', '?']
      bank.forEach((w, i) => {
        const ww = w.length * 10 + 30
        const bx = 24 + (i % 3) * 116
        const by = 430 + Math.floor(i / 3) * 58
        k.rr(bx, by, Math.max(ww, 100), 44, 12, '#fff', '#CBD5E1')
        k.text(w, bx + Math.max(ww, 100) / 2, by + 28, { size: 16, weight: 600, color: '#1E293B', align: 'center' })
      })
      k.rr(0, 640, 390, 204, 0, '#DCFCE7')
      k.text('✓ Nice job!', 24, 690, { size: 22, weight: 800, color: '#15803D' })
      k.rr(24, 730, 342, 58, 18, '#22C55E')
      k.text('CONTINUE', 195, 766, { size: 17, weight: 800, color: '#fff', align: 'center' })
    },
  },
  {
    id: 'demo:browser-page',
    name: 'Extension on a page',
    app: 'Browser extension',
    w: 1280,
    h: 760,
    paint(k) {
      k.fill('#F8FAFC')
      k.c.fillStyle = '#fff'
      k.c.fillRect(0, 0, 1280, 64)
      k.rr(40, 20, 120, 24, 6, '#0F172A')
      ;['Docs', 'Pricing', 'Blog'].forEach((t, i) => k.text(t, 220 + i * 90, 38, { size: 15, color: '#475569' }))
      k.text('How to write clearer product specs', 80, 150, { size: 40, weight: 800, color: '#0F172A' })
      k.text('A practical guide · 8 min read', 80, 186, { size: 16, color: '#64748B' })
      for (let i = 0; i < 12; i++) {
        const w = [620, 680, 540, 660, 600, 690, 450, 640, 610, 580, 670, 520][i]
        const y = 230 + i * 34 + (i > 5 ? 30 : 0)
        k.rr(80, y, w, 12, 6, '#E2E8F0')
      }
      k.rr(80, 302, 360, 16, 3, 'rgba(250,204,21,0.55)')
      k.rr(80, 336, 260, 16, 3, 'rgba(250,204,21,0.55)')
      k.rr(850, 20, 390, 470, 18, '#fff', '#E2E8F0')
      k.c.save()
      k.c.shadowColor = 'rgba(15,23,42,0.18)'
      k.c.shadowBlur = 40
      k.c.shadowOffsetY = 16
      k.rr(850, 20, 390, 470, 18, '#fff')
      k.c.restore()
      k.rr(874, 44, 34, 34, 10, k.lin(874, 44, 908, 78, ['#8B5CF6', '#6366F1']))
      k.text('Highlight', 920, 68, { size: 18, weight: 800, color: '#0F172A' })
      k.rr(1150, 48, 66, 26, 13, '#DCFCE7')
      k.text('ON', 1183, 66, { size: 12, weight: 800, color: '#15803D', align: 'center' })
      k.text('2 highlights on this page', 874, 112, { size: 14, color: '#64748B' })
      ;[
        ['“Specs should describe outcomes,', 'not solutions.”', '#FDE047'],
        ['“Write the acceptance criteria', 'before the first mockup.”', '#A5B4FC'],
      ].forEach(([a, b, c], i) => {
        const y = 132 + i * 110
        k.rr(874, y, 342, 96, 14, '#F8FAFC')
        k.rr(874, y, 5, 96, 2.5, c)
        k.text(a, 894, y + 38, { size: 15, weight: 600, color: '#0F172A' })
        k.text(b, 894, y + 62, { size: 15, weight: 600, color: '#0F172A' })
      })
      ;['#FDE047', '#A5B4FC', '#86EFAC', '#F9A8D4'].forEach((c, i) => k.circle(894 + i * 40, 384, 14, c))
      k.rr(874, 420, 342, 46, 12, '#6366F1')
      k.text('Export to Notes', 1045, 449, { size: 15, weight: 700, color: '#fff', align: 'center' })
    },
  },
  {
    id: 'demo:tablet-dashboard',
    name: 'Analytics dashboard',
    app: 'Productivity',
    w: 820,
    h: 1180,
    paint(k) {
      k.fill('#F5F6FA')
      k.statusBar('#111')
      k.text('Overview', 40, 110, { size: 34, weight: 800, color: '#0F172A' })
      k.text('Last 30 days', 40, 140, { size: 16, color: '#64748B' })
      const kpi = [
        ['Revenue', '$84.2k', '+12%', '#6366F1'],
        ['Users', '12,480', '+8%', '#10B981'],
        ['Churn', '2.1%', '-0.4%', '#F59E0B'],
      ]
      kpi.forEach(([l, v, c, col], i) => {
        const x = 40 + i * 252
        k.rr(x, 170, 236, 130, 22, '#fff')
        k.text(l, x + 24, 208, { size: 15, color: '#64748B' })
        k.text(v, x + 24, 252, { size: 32, weight: 800, color: '#0F172A' })
        k.text(c, x + 24, 280, { size: 14, weight: 700, color: col })
      })
      k.rr(40, 320, 740, 400, 24, '#fff')
      k.text('Revenue', 70, 366, { size: 20, weight: 700, color: '#0F172A' })
      const pts = k.wave(30, 5, 0.2, 0.9).map((v, i) => [70 + i * 23.4, 420 + 260 * (1 - v)] as [number, number])
      k.area(pts, 690, k.lin(0, 420, 0, 690, ['rgba(99,102,241,0.3)', 'rgba(99,102,241,0)']))
      k.linePath(pts, '#6366F1', 4)
      k.rr(40, 740, 360, 380, 24, '#fff')
      k.text('Channels', 70, 786, { size: 20, weight: 700, color: '#0F172A' })
      k.ring(220, 950, 110, 34, 0.62, '#6366F1', '#EEF2FF')
      k.ring(220, 950, 64, 30, 0.38, '#10B981', '#ECFDF5')
      k.rr(420, 740, 360, 380, 24, '#fff')
      k.text('Top pages', 450, 786, { size: 20, weight: 700, color: '#0F172A' })
      ;[0.9, 0.72, 0.55, 0.4, 0.28].forEach((v, i) => {
        const y = 820 + i * 56
        k.rr(450, y, 300, 34, 10, '#F1F5F9')
        k.rr(450, y, 300 * v, 34, 10, '#C7D2FE')
        k.text(['/pricing', '/docs', '/blog', '/signup', '/about'][i], 466, y + 23, { size: 14, weight: 600, color: '#1E1B4B' })
      })
    },
  },
  {
    id: 'demo:desktop-notes',
    name: 'Notes app',
    app: 'Desktop',
    w: 1440,
    h: 900,
    paint(k) {
      k.fill('#FFFFFF')
      k.rr(0, 0, 260, 900, 0, '#F4F4F5')
      k.text('Notes', 28, 52, { size: 20, weight: 800, color: '#18181B' })
      ;['All notes', 'Favorites', 'Projects', 'Journal', 'Archive'].forEach((t, i) => {
        if (i === 2) k.rr(16, 78 + i * 42, 228, 36, 10, '#E4E4E7')
        k.rr(30, 88 + i * 42, 16, 16, 4, i === 2 ? '#8B5CF6' : '#A1A1AA')
        k.text(t, 58, 102 + i * 42, { size: 15, color: '#27272A', weight: i === 2 ? 600 : 400 })
      })
      k.rr(260, 0, 340, 900, 0, '#FAFAFA')
      ;['Launch checklist', 'Customer interviews', 'Q1 planning', 'Pricing ideas', 'Weekly sync'].forEach((t, i) => {
        const y = 24 + i * 110
        if (i === 0) k.rr(272, y, 316, 98, 14, '#EDE9FE')
        k.text(t, 292, y + 34, { size: 16, weight: 700, color: '#18181B' })
        k.rr(292, y + 50, 250, 9, 4.5, '#E4E4E7')
        k.rr(292, y + 68, 190, 9, 4.5, '#E4E4E7')
      })
      k.text('Launch checklist', 660, 92, { size: 38, weight: 800, color: '#18181B' })
      k.text('Edited 2 minutes ago', 660, 124, { size: 14, color: '#A1A1AA' })
      ;[true, true, true, false, false, false].forEach((done, i) => {
        const y = 176 + i * 56
        k.rr(660, y, 24, 24, 7, done ? '#8B5CF6' : '#fff', done ? undefined : '#D4D4D8')
        if (done) k.linePath([[666, y + 12], [671, y + 17], [679, y + 7]], '#fff', 2.5)
        k.rr(702, y + 7, [380, 300, 420, 340, 260, 390][i], 11, 5.5, done ? '#D4D4D8' : '#A1A1AA')
      })
      k.rr(660, 540, 720, 260, 18, k.lin(660, 540, 1380, 800, ['#EDE9FE', '#E0F2FE']))
      k.text('“Ship small, learn fast.”', 700, 680, { size: 30, weight: 700, color: '#4C1D95', font: 'Playfair Display' })
    },
  },
]

export const DEMO_SCREENS = screens

export const isDemoAsset = (id: string) => id.startsWith('demo:')

export function getDemoScreen(id: string) {
  return screens.find((s) => s.id === id)
}

export async function renderDemoAsset(id: string): Promise<HTMLCanvasElement | undefined> {
  const def = getDemoScreen(id)
  if (!def) return undefined
  await Promise.all(
    [400, 600, 700, 800].map((w) => document.fonts.load(`${w} 16px "Inter"`).catch(() => undefined)),
  )
  await document.fonts.load('700 16px "Playfair Display"').catch(() => undefined)
  const canvas = document.createElement('canvas')
  canvas.width = def.w * SCALE
  canvas.height = def.h * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)
  def.paint(new Kit(ctx, def.w, def.h))
  return canvas
}
