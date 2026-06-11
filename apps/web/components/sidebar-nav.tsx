'use client'

import { FileText, Calendar, Banknote, Car, Newspaper, CheckSquare, Users } from "lucide-react";
import { SidebarCollapsible } from "./sidebar-collapsible";
import { SidebarItem } from "./sidebar-item";

interface SidebarNavProps {
  isAdmin?: boolean;
  counts?: {
    documents: number;
    tasks: number;
    meetings: number;
  };
}

export function SidebarNav({ isAdmin, counts }: SidebarNavProps) {
  return (
    <ul className="space-y-1">
      <SidebarCollapsible 
        icon={<FileText size={18} />} 
        text="Quản lý Công văn" 
        basePath="/documents"
        badge={counts?.documents}
        items={[
          { href: "/documents/incoming", text: "Công văn đến", badge: counts?.documents },
          { href: "/documents/sent", text: "Công văn đã gửi" }
        ]}
      />
      <SidebarCollapsible 
        icon={<CheckSquare size={18} />} 
        text="Quản lý Công việc" 
        basePath="/tasks"
        badge={counts?.tasks}
        items={[
          { href: "/tasks/incoming", text: "Công việc đã nhận", badge: counts?.tasks },
          { href: "/tasks/sent", text: "Công việc đã giao" }
        ]}
      />
      <SidebarItem href="/meetings" icon={<Calendar size={18} />} text="Quản lý Lịch họp" badge={counts?.meetings} />
      <SidebarItem href="/payslips" icon={<Banknote size={18} />} text="Quản lý Phiếu lương" />
      <SidebarItem href="/vehicles" icon={<Car size={18} />} text="Quản lý Xin xe" />
      <SidebarItem href="/news" icon={<Newspaper size={18} />} text="Bảng tin Nội bộ" />
      {isAdmin && (
        <SidebarItem href="/hr" icon={<Users size={18} />} text="Quản lý Nhân sự" />
      )}
    </ul>
  );
}
