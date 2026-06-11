export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamic = 'force-dynamic';

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
  User,
  Users
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tasksCount = 0;
  let documentsCount = 0;
  let meetingsCount = 0;
  let canAccessHR = false;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin, department').eq('id', user.id).single();
    
    const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch');
    canAccessHR = profile?.is_admin || isHR;

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Công việc chưa xử lý
    const { count: tCount } = await supabaseAdmin
      .from('task_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('processing_status', 'Chưa xử lý');
    tasksCount = tCount || 0;

    // 2. Công văn chưa xử lý
    const { count: dCount } = await supabaseAdmin
      .from('document_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('processing_status', 'Chưa xử lý');
    documentsCount = dCount || 0;

    // 3. Cuộc họp trong ngày
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
      if (m.created_by === user.id) return true;
      if (!m.departments || m.departments.length === 0) return true;
      if (m.departments.includes('Tất cả')) return true;
      if (profile?.department && m.departments.includes(profile.department)) return true;
      return false;
    }).length;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border rounded-xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-blue-700 mb-1">
            Xin chào! Chúc bạn một ngày làm việc vui vẻ và hiệu quả! 👋
          </h2>
          <p className="text-slate-600 text-sm">
            Bạn có <span className="font-bold text-red-500">{documentsCount}</span> công văn chưa tiếp nhận, <span className="font-bold text-red-500">{tasksCount}</span> công việc chưa tiếp nhận và <span className="font-bold text-red-500">{meetingsCount}</span> lịch họp trong hôm nay.
          </p>
        </div>
        <RealTimeClock />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8">
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
        {canAccessHR && (
          <DashboardCard 
            href="/hr" 
            icon={<Users size={32} className="text-indigo-500" />} 
            title="Nhân Sự" 
            description="Quản lý nhân sự" 
          />
        )}
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
