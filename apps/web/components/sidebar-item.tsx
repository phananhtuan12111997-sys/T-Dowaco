'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarItem({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  const pathname = usePathname();
  // We use startsWith to match sub-paths (e.g. /payslips/view matches /payslips)
  // However, we should be careful if there are overlapping paths like /meetings and /meetings-archived
  // In this app, paths are distinct enough so startsWith works well.
  const isActive = pathname.startsWith(href);
  
  return (
    <li>
      <Link 
        href={href} 
        className={`flex items-center gap-3 px-6 py-3 transition-colors ${
          isActive 
            ? 'bg-blue-800/60 text-white font-semibold border-l-4 border-white pl-[20px]' 
            : 'text-blue-100 hover:bg-blue-800/40 hover:text-white border-l-4 border-transparent'
        }`}
      >
        <span className={isActive ? 'text-white' : ''}>{icon}</span>
        <span className="text-sm">{text}</span>
      </Link>
    </li>
  );
}
