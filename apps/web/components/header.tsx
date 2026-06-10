'use client'

import { Menu, Bell, User, LogOut, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { logout } from '@/app/logout/actions'
import Link from 'next/link'
import { SidebarNav } from './sidebar-nav'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { NotificationBell } from './notification-bell'

interface Profile {
  full_name: string;
  role: string;
  department?: string;
  avatar_url?: string;
  is_admin?: boolean;
}

export function Header({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex justify-between items-center sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-[#1a56db] text-white w-64 border-none">
            <SheetHeader className="hidden">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <Link href="/" className="h-24 flex flex-col items-center justify-center gap-1 border-b border-blue-500/30 hover:bg-blue-800/40 transition-colors py-2">
              <div className="bg-white rounded-full p-1 h-10 w-10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
              </div>
              <span className="font-bold text-xs tracking-wider text-center px-2">CÔNG TY CỔ PHẦN CẤP NƯỚC LONG KHÁNH</span>
            </Link>
            <nav className="flex-1 py-4 overflow-y-auto">
              <SidebarNav isAdmin={profile?.is_admin || profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')} />
            </nav>
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">CẤP NƯỚC LONG KHÁNH</h1>
          <p className="text-xs md:text-sm text-slate-500 hidden sm:block">Hệ thống Văn phòng điện tử tích hợp</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        {/* Notification */}
        <NotificationBell />
        
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
