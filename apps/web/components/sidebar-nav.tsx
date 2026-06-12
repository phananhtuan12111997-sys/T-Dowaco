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
        basePath="/cong-van"
        badge={counts?.documents}
        items={[
          { href: "/cong-van/den", text: "Công văn đến", badge: counts?.documents },
          { href: "/cong-van/di", text: "Công văn đã gửi" }
        ]}
      />
      <SidebarCollapsible 
        icon={<CheckSquare size={18} />} 
        text="Quản lý Công việc" 
        basePath="/cong-viec"
        badge={counts?.tasks}
        items={[
          { href: "/cong-viec/duoc-giao", text: "Công việc đã nhận", badge: counts?.tasks },
          { href: "/cong-viec/da-giao", text: "Công việc đã giao" }
        ]}
      />
      <SidebarItem href="/cuoc-hop" icon={<Calendar size={18} />} text="Quản lý Lịch họp" badge={counts?.meetings} />
      <SidebarItem href="/bang-luong" icon={<Banknote size={18} />} text="Quản lý Phiếu lương" />
      <SidebarItem href="/xe" icon={<Car size={18} />} text="Quản lý Xin xe" />
      <SidebarItem href="/bang-tin" icon={<Newspaper size={18} />} text="Bảng tin Nội bộ" />
      {isAdmin && (
        <SidebarItem href="/nhan-su" icon={<Users size={18} />} text="Quản lý Nhân sự" />
      )}
    </ul>
  );
}
