import { Select } from '@/components/ui/primitives'
import { BUILTIN_FONTS, loadFont, useFonts } from '@/lib/fonts'
import type { Theme, ThemeColorKey } from '@/types/project'
import { ColorPicker, Row } from './controls'

const KEYS: Array<[ThemeColorKey, string]> = [
  ['primary', 'Primary'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['background', 'Background'],
  ['surface', 'Surface'],
  ['text', 'Text'],
  ['muted', 'Muted text'],
]

export function FontSelect({ value, onChange }: { value: string; onChange: (f: string) => void }) {
  const custom = useFonts((s) => s.custom)
  const all = [...BUILTIN_FONTS, ...custom]
  const opts = all.map((f) => ({
    value: f.family,
    group: f.custom ? 'Uploaded' : 'Bundled',
    label: <span style={{ fontFamily: `"${f.family}"` }}>{f.family}</span>,
  }))
  if (!all.some((f) => f.family === value)) opts.unshift({ value, group: 'Bundled', label: <span>{value}</span> })
  return (
    <Select
      value={value}
      onChange={(f) => {
        void loadFont(f, 700)
        onChange(f)
      }}
      options={opts}
    />
  )
}

export function ThemeEditor({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5">
        {KEYS.map(([k, label]) => (
          <div key={k} className="flex flex-col items-center gap-1" title={label}>
            <ColorPicker value={theme.colors[k]} allowAlpha={false} onChange={(c) => onChange({ ...theme, colors: { ...theme.colors, [k]: c } })} />
            <span className="w-full truncate text-center text-[9px] text-subtle">{label}</span>
          </div>
        ))}
      </div>
      <Row label="Headings">
        <FontSelect value={theme.fonts.heading} onChange={(f) => onChange({ ...theme, fonts: { ...theme.fonts, heading: f } })} />
      </Row>
      <Row label="Body">
        <FontSelect value={theme.fonts.body} onChange={(f) => onChange({ ...theme, fonts: { ...theme.fonts, body: f } })} />
      </Row>
    </div>
  )
}
