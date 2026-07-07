'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, CalendarPlus, Dumbbell, LineChart } from 'lucide-react'

const navItems = [
  { href: '/client/dashboard', label: 'Home', Icon: Home },
  { href: '/client/packages', label: 'Packages', Icon: Package },
  { href: '/client/book', label: 'Book', Icon: CalendarPlus },
  { href: '/client/plan', label: 'Plan', Icon: Dumbbell },
  { href: '/client/progress', label: 'Progress', Icon: LineChart },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/60 z-50 pb-safe">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {active && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} className="transition-transform duration-200" />
                <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
