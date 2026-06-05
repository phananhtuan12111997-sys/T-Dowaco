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
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "T-Dowaco - T-Dowaco Workspace",
  description: "Hệ thống quản trị nội bộ T-Dowaco",
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

  return (
    <div className={`${inter.className} bg-slate-50 min-h-screen flex`}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a56db] text-white flex flex-col min-h-screen fixed left-0 top-0 z-20">
        <Link href="/" className="h-20 flex items-center justify-center gap-3 border-b border-blue-500/30 hover:bg-blue-800/40 transition-colors">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
          <span className="font-bold text-xl tracking-wider">T-DOWACO</span>
        </Link>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <SidebarCollapsible 
              icon={<FileText size={18} />} 
              text="Quản lý Công văn" 
              basePath="/documents"
              items={[
                { href: "/documents/incoming", text: "Công văn đến" },
                { href: "/documents/sent", text: "Công văn đã gửi" },
                { href: "/documents/search", text: "Tra cứu Công văn cũ" }
              ]}
            />
            <SidebarItem href="/meetings" icon={<Calendar size={18} />} text="Quản lý Lịch họp" />
            <SidebarItem href="/payslips" icon={<Banknote size={18} />} text="Quản lý Phiếu lương" />
            <SidebarItem href="/vehicles" icon={<Car size={18} />} text="Quản lý Xin xe" />
            <SidebarItem href="/news" icon={<Newspaper size={18} />} text="Bảng tin nội bộ" />
            <SidebarItem href="/tasks" icon={<CheckSquare size={18} />} text="Quản lý Công việc" />
            {profile?.is_admin && (
              <SidebarItem href="/hr" icon={<Users size={18} />} text="Quản lý Nhân sự" />
            )}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header profile={profile} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-6 py-3 text-blue-100 hover:bg-blue-800/40 hover:text-white transition-colors">
        {icon}
        <span className="text-sm font-medium">{text}</span>
      </Link>
    </li>
  );
}
