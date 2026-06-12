"use client"

import { useState } from 'react'
import Image from 'next/image'
import { User, Mail, Phone, MapPin, Building, Briefcase, Calendar, CreditCard, Map, FileText, Heart } from 'lucide-react'
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserActions } from './user-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function HrUserRow({ user }: { user: any }) {
  const [openView, setOpenView] = useState(false)

  // format date
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'

  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={(e) => {
          // ignore clicks on action buttons or modals inside
          const target = e.target as HTMLElement
          if (target.closest('button') || target.closest('[role="dialog"]') || target.closest('.lucide-edit') || target.closest('.lucide-trash-2')) return
          setOpenView(true)
        }}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden shrink-0 relative">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.full_name} fill className="object-cover" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div className="font-medium">{user.full_name}</div>
          </div>
        </TableCell>
        <TableCell>{user.username}</TableCell>
        <TableCell>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {user.department}
          </span>
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
            {user.role}
          </span>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {user.phone && <div>{user.phone}</div>}
            {user.email && <div className="text-slate-500">{user.email}</div>}
          </div>
        </TableCell>
        <TableCell>
          {user.is_admin ? (
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">Admin</Badge>
          ) : user.force_password_change ? (
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Chờ đổi mật khẩu</Badge>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Hoạt động</Badge>
          )}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <UserActions user={user} />
        </TableCell>
      </TableRow>

      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin nhân viên</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden shrink-0 shadow-sm border-4 border-white relative">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.full_name} fill className="object-cover" />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">{user.full_name}</h2>
              <p className="text-sm text-slate-500">@{user.username}</p>
              <div className="mt-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 inline-block">
                {user.gender || 'Chưa cập nhật giới tính'}
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Building className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Phòng ban</div>
                <div className="text-slate-900 font-medium">{user.department || 'Chưa cập nhật'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Briefcase className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Chức vụ</div>
                <div className="text-slate-900 font-medium">{user.role || 'Chưa cập nhật'}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Phone className="h-5 w-5 text-slate-400" />
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Số điện thoại</div>
                  <div className="text-slate-900 font-medium truncate">{user.phone || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Mail className="h-5 w-5 text-slate-400" />
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Email</div>
                  <div className="text-slate-900 font-medium truncate">{user.email || 'Chưa cập nhật'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <MapPin className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Địa chỉ</div>
                <div className="text-slate-900 font-medium">{user.address || 'Chưa cập nhật'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-500 uppercase font-semibold">CCCD/CMND</div>
                  <div className="text-slate-900 font-medium truncate">{user.cccd || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Map className="h-5 w-5 text-slate-400" />
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Quê quán</div>
                  <div className="text-slate-900 font-medium truncate">{user.hometown || 'Chưa cập nhật'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <FileText className="h-5 w-5 text-slate-400" />
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Số BHXH</div>
                  <div className="text-slate-900 font-medium truncate">{user.social_insurance_number || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Heart className="h-5 w-5 text-slate-400" />
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Số thẻ BHYT</div>
                  <div className="text-slate-900 font-medium truncate">{user.health_insurance_number || 'Chưa cập nhật'}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Ngày gia nhập</div>
                <div className="text-slate-900 font-medium">{joinDate}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
