'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Today', icon: '🏠' },
  { href: '/meals', label: 'Add Meal', icon: '🍽️' },
  { href: '/drafts', label: 'Drafts', icon: '📋' },
  { href: '/trends', label: 'Trends', icon: '📈' },
  { href: '/activity', label: 'Activity', icon: '⚡' },
]

export default function Nav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800">
      <div className="flex max-w-lg mx-auto">
        {TABS.map((tab) => {
          const active = path === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : ''}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
