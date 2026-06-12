'use client'

import { useState } from 'react'

const REACTIONS = [
  { id: 'like', label: 'Thích', icon: '👍', color: 'text-blue-600' },
  { id: 'love', label: 'Yêu thích', icon: '❤️', color: 'text-red-500' },
  { id: 'haha', label: 'Haha', icon: '😆', color: 'text-yellow-500' },
  { id: 'wow', label: 'Wow', icon: '😮', color: 'text-yellow-500' },
  { id: 'sad', label: 'Buồn', icon: '😢', color: 'text-yellow-500' },
  { id: 'angry', label: 'Phẫn nộ', icon: '😡', color: 'text-orange-500' }
]

export function ReactionPicker({ onSelect }: { onSelect: (type: string) => void }) {
  return (
    <div className="absolute bottom-[calc(100%-0.5rem)] left-0 pb-2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-slate-100 p-1 flex gap-1 animate-in fade-in slide-in-from-bottom-2">
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            className="hover:scale-125 transition-transform origin-bottom p-1.5 rounded-full hover:bg-slate-50"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(r.id)
            }}
            title={r.label}
          >
            <span className="text-2xl leading-none">{r.icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function getReactionIcon(type: string) {
  return REACTIONS.find(r => r.id === type) || REACTIONS[0]
}
