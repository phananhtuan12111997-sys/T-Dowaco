import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Newspaper, 
  Calendar, 
  CheckSquare, 
  Car, 
  Banknote 
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const currentDate = "05/06/2026";
  const currentTime = "13:58:56";

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">D-Office Workspace</h1>
          <p className="text-slate-500">Hệ thống Văn phòng điện tử tích hợp</p>
        </div>
        <div className="flex gap-2">
          {/* Mock settings buttons */}
          <div className="bg-white border rounded p-2 text-slate-500 shadow-sm">
            Làm mới
          </div>
          <div className="bg-blue-600 text-white rounded p-2 shadow-sm">
            Cài đặt
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-white border rounded-xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-blue-700 mb-1">
            Xin chào, Văn thư Công ty CP Cấp nước Long Khánh! 👋
          </h2>
          <p className="text-slate-600 text-sm">
            Bạn có <span className="font-bold text-red-500">0</span> công việc cần xử lý và <span className="font-bold text-red-500">0</span> lịch họp trong hôm nay. Chúc bạn một ngày làm việc hiệu quả!
          </p>
        </div>
        <div className="text-right border-l pl-6">
          <p className="text-xs text-slate-500 font-medium">ĐỒNG HỒ HỆ THỐNG</p>
          <p className="text-lg font-bold text-slate-800">
            {currentTime} - {currentDate}
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-8">
        <DashboardCard 
          href="/documents" 
          icon={<FileText size={32} className="text-blue-500" />} 
          title="Công Văn" 
          description="Quản lý văn bản đến/đi" 
        />
        <DashboardCard 
          href="/news" 
          icon={<Newspaper size={32} className="text-teal-500" />} 
          title="Tin Nội Bộ" 
          description="Thông báo công ty" 
        />
        <DashboardCard 
          href="/meetings" 
          icon={<Calendar size={32} className="text-orange-500" />} 
          title="Lịch Họp" 
          description="Đăng ký phòng họp" 
        />
        <DashboardCard 
          href="/tasks" 
          icon={<CheckSquare size={32} className="text-green-500" />} 
          title="Giao Việc" 
          description="Theo dõi tiến độ" 
        />
        <DashboardCard 
          href="/vehicles" 
          icon={<Car size={32} className="text-purple-500" />} 
          title="Điều Xe" 
          description="Đăng ký xe công tác" 
        />
        <DashboardCard 
          href="/payslips" 
          icon={<Banknote size={32} className="text-slate-600" />} 
          title="Phiếu Lương" 
          description="Tra cứu thu nhập cá nhân" 
        />
      </div>
    </div>
  );
}

function DashboardCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-slate-200">
        <CardContent className="p-6 flex flex-col items-center text-center justify-center h-full gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
