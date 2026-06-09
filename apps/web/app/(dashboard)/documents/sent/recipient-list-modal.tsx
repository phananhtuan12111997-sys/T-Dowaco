'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users } from 'lucide-react'

export function RecipientListModal({ count, recipients }: { count: number, recipients: any[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-1 text-[#1a56db] cursor-pointer hover:underline font-medium w-fit mx-auto">
          <Users className="h-4 w-4" />
          <span>{count}</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Danh sách người nhận ({count})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {recipients?.map((r: any) => {
            const p = r.profile || r.profiles;
            return (
            <div key={r.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 overflow-hidden shrink-0">
                {p?.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  p?.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-slate-800 truncate">{p?.full_name || 'Người dùng không xác định'}</p>
                <p className="text-xs text-slate-500 truncate">
                  {p?.department || 'Chưa có phòng ban'}
                  {p?.role ? ` - ${p.role}` : ''}
                </p>
              </div>
            </div>
          )})}
        </div>
      </DialogContent>
    </Dialog>
  )
}
