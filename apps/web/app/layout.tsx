import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  Banknote, 
  Car, 
  Newspaper, 
  CheckSquare 
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DOWACO - D-Office Workspace",
  description: "Hệ thống quản trị nội bộ T-Dowaco",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex`}>
        {/* Sidebar */}
        <aside className="w-64 bg-[#1e293b] text-white flex flex-col min-h-screen fixed left-0 top-0">
          <div className="h-16 flex items-center justify-center border-b border-slate-700 font-bold text-xl tracking-wider">
            DOWACO
          </div>
          <nav className="flex-1 py-4">
            <ul className="space-y-1">
              <SidebarItem href="/documents" icon={<FileText size={18} />} text="Quản lý Công văn" />
              <SidebarItem href="/meetings" icon={<Calendar size={18} />} text="Quản lý Lịch họp" />
              <SidebarItem href="/payslips" icon={<Banknote size={18} />} text="Quản lý Phiếu lương" />
              <SidebarItem href="/vehicles" icon={<Car size={18} />} text="Quản lý Xin xe" />
              <SidebarItem href="/news" icon={<Newspaper size={18} />} text="Tin nội bộ" />
              <SidebarItem href="/tasks" icon={<CheckSquare size={18} />} text="Quản lý Công việc" />
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}

function SidebarItem({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
        {icon}
        <span className="text-sm font-medium">{text}</span>
      </Link>
    </li>
  );
}
