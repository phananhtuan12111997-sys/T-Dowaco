import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { RealTimeClock } from "@/components/real-time-clock";
import { 
  FileText, 
  Newspaper, 
  Calendar, 
  CheckSquare, 
  Car, 
  Banknote,
  Bell,
  User
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border rounded-xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-blue-700 mb-1">
            Xin chào! Chúc bạn một ngày làm việc vui vẻ và hiệu quả! 👋
          </h2>
          <p className="text-slate-600 text-sm">
            Bạn có <span className="font-bold text-red-500">0</span> công việc cần xử lý và <span className="font-bold text-red-500">0</span> lịch họp trong hôm nay.
          </p>
        </div>
        <RealTimeClock />
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
