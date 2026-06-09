'use client'

import { FileText, Calendar, Banknote, Car, Newspaper, CheckSquare, Users } from "lucide-react";
import { SidebarCollapsible } from "./sidebar-collapsible";
import { SidebarItem } from "./sidebar-item";

interface SidebarNavProps {
  isAdmin?: boolean;
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
  return (
    <ul className="space-y-1">
      <SidebarCollapsible 
        icon={<FileText size={18} />} 
        text="Quản lý Công văn" 
        basePath="/documents"
        items={[
          { href: "/documents/incoming", text: "Công văn đến" },
          { href: "/documents/sent", text: "Công văn đã gửi" }
        ]}
      />
      <SidebarItem href="/meetings" icon={<Calendar size={18} />} text="Quản lý Lịch họp" />
      <SidebarItem href="/payslips" icon={<Banknote size={18} />} text="Quản lý Phiếu lương" />
      <SidebarItem href="/vehicles" icon={<Car size={18} />} text="Quản lý Xin xe" />
      <SidebarItem href="/tasks" icon={<CheckSquare size={18} />} text="Quản lý Công việc" />
      <SidebarItem href="/news" icon={<Newspaper size={18} />} text="Bảng tin Nội bộ" />
      {isAdmin && (
        <SidebarItem href="/hr" icon={<Users size={18} />} text="Quản lý Nhân sự" />
      )}
    </ul>
  );
}
