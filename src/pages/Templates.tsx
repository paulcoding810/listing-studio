import { useState } from 'react'
import { PageHeader } from '@/components/dashboard/AppShell'
import { TemplateCard } from '@/components/dashboard/TemplateCard'
import { cn } from '@/lib/utils'
import { STORES } from '@/targets'
import { TEMPLATES } from '@/templates'
import { CATEGORIES } from '@/templates/builder'
import type { StoreId } from '@/types/target'

export function Templates() {
  const [cat, setCat] = useState<string>('All')
  const [store, setStore] = useState<StoreId | 'all'>('all')
  const list = TEMPLATES.filter((t) => (cat === 'All' || t.category === cat) && (store === 'all' || t.store === store))
  const usedStores = STORES.filter((s) => TEMPLATES.some((t) => t.store === s.id))
  const chip = (active: boolean) =>
    cn('cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors', active ? 'border-accent bg-accent-soft text-fg' : 'border-border text-muted hover:text-fg')
  return (
    <div className="pb-16">
      <PageHeader title="Templates" subtitle="Fully editable designs. Every text, device and shape can be changed after you apply one." />
      <div className="space-y-3 px-6 pb-6 lg:px-10">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(store === 'all')} onClick={() => setStore('all')}>
            All stores
          </button>
          {usedStores.map((s) => (
            <button key={s.id} type="button" className={chip(store === s.id)} onClick={() => setStore(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} type="button" className={chip(cat === c)} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-10 xl:grid-cols-4">
        {list.map((t) => (
          <TemplateCard key={t.id} t={t} />
        ))}
      </div>
      {list.length === 0 && <p className="py-16 text-center text-sm text-muted">No templates in this combination yet.</p>}
    </div>
  )
}
