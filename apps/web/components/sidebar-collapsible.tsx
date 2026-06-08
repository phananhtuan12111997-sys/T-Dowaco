'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface SubItem {
  href: string
  text: string
}

interface SidebarCollapsibleProps {
  icon: React.ReactNode
  text: string
  items: SubItem[]
  basePath: string
}

export function SidebarCollapsible({ icon, text, items, basePath }: SidebarCollapsibleProps) {
  const pathname = usePathname()
  // Mặc định mở nếu đường dẫn hiện tại bắt đầu bằng basePath
  const [isOpen, setIsOpen] = useState(pathname.startsWith(basePath))

  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-3 text-blue-100 hover:bg-blue-800/40 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium">{text}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      
      {isOpen && (
        <ul className="bg-[#1748b8] py-2">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href === '/documents/incoming' && pathname === '/documents/create')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center pl-14 pr-6 py-2 text-sm transition-colors ${
                    isActive 
                      ? 'text-white font-semibold' 
                      : 'text-blue-100 hover:text-white hover:bg-blue-800/40'
                  }`}
                >
                  <span className="mr-2 text-xs opacity-50">-</span> {item.text}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
