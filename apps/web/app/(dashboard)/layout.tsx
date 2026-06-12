export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
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
  title: "LKWA - LKWA Workspace",
  description: "Hệ thống quản trị nội bộ LKWA",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile: any = null;
  let documentsCount = 0;
  let tasksCount = 0;
  let meetingsCount = 0;

  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch counts
    const { count: dCount } = await supabaseAdmin
      .from('document_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('processing_status', 'Chưa xử lý');
    documentsCount = dCount || 0;

    const { count: tCount } = await supabaseAdmin
      .from('task_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('processing_status', 'Chưa xử lý');
    tasksCount = tCount || 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const { data: meetingsTodayData } = await supabaseAdmin
      .from('meetings')
      .select('created_by, departments, start_time')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    meetingsCount = (meetingsTodayData || []).filter((m: any) => {
      if (profile?.department === 'Phòng tổ chức Hành chánh' || profile?.is_admin) return true;
      if (m.created_by === user.id) return true;
      if (!m.departments || m.departments.length === 0) return true;
      if (m.departments.includes('Tất cả')) return true;
      if (profile?.department && m.departments.includes(profile.department)) return true;
      if (m.departments.includes(user.id)) return true;
      return false;
    }).length;
  }
  const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch');

  return (
    <div className={`${inter.className} bg-slate-50 min-h-screen flex`}>
      {user && <RealtimeListener userId={user.id} />}
      {/* Sidebar - hidden on mobile, visible on lg screens */}
      <aside className="w-64 bg-[#1a56db] text-white hidden lg:flex flex-col min-h-screen fixed left-0 top-0 z-20">
        <Link href="/" className="h-20 flex items-center justify-center gap-3 border-b border-blue-500/30 hover:bg-blue-800/40 transition-colors">
          <Image src="/logo.png" alt="Logo" width={48} height={48} className="h-12 w-auto object-contain" priority />
          <span className="font-bold text-xl tracking-wider">LKWA</span>
        </Link>
        <nav className="flex-1 py-4">
          <SidebarNav isAdmin={profile?.is_admin || isHR} counts={{ documents: documentsCount, tasks: tasksCount, meetings: meetingsCount }} />
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
