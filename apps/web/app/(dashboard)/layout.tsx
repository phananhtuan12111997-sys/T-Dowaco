import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  Banknote, 
  Car, 
  Newspaper, 
  CheckSquare,
  Users
} from "lucide-react";
import { Header } from "@/components/header";
import { SidebarCollapsible } from "@/components/sidebar-collapsible";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

import { RealtimeListener } from "@/components/realtime-listener";

export const metadata: Metadata = {
  title: "LKW - LKW Workspace",
  description: "Hệ thống quản trị nội bộ LKW",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }
  const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch');

  return (
    <div className={`${inter.className} bg-slate-50 min-h-screen flex`}>
      {user && <RealtimeListener userId={user.id} />}
      {/* Sidebar - hidden on mobile, visible on lg screens */}
      <aside className="w-64 bg-[#1a56db] text-white hidden lg:flex flex-col min-h-screen fixed left-0 top-0 z-20">
        <Link href="/" className="h-20 flex items-center justify-center gap-3 border-b border-blue-500/30 hover:bg-blue-800/40 transition-colors">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
          <span className="font-bold text-xl tracking-wider">LKW</span>
        </Link>
        <nav className="flex-1 py-4">
          <SidebarNav isAdmin={profile?.is_admin || isHR} />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col w-full min-h-screen max-w-full">
        <Header profile={profile} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
