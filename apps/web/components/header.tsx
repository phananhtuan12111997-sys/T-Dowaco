'use client'

import { Bell, User, LogOut, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from '@/app/logout/actions'
import Link from 'next/link'

interface Profile {
  full_name: string;
  role: string;
  department?: string;
  avatar_url?: string;
}

export function Header({ profile }: { profile: Profile | null }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-[#1a56db]">T-Dowaco Workspace</h1>
        <p className="text-sm text-slate-500">Hệ thống Văn phòng điện tử tích hợp</p>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Notification */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={24} />
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </button>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{profile?.full_name || 'Người dùng'}</p>
                <p className="text-xs text-slate-500">
                  {profile?.department && profile?.role 
                    ? `${profile.department} - ${profile.role}` 
                    : profile?.role || profile?.department || 'Chưa cập nhật'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>Cập nhật thông tin</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => logout()}
              className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
