import { NewsForm } from './client-form'
import Link from 'next/link'

export default function CreateNewsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>LKW</span>
        <span>→</span>
        <Link href="/news" className="hover:text-[#1a56db]">Bảng tin nội bộ</Link>
        <span>→</span>
        <span>Đăng tin mới</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-[#1a56db]">Đăng tin công ty mới</h2>
          <p className="text-sm text-slate-500 mt-1">Soạn thông báo, tin tức để gửi tới toàn thể nhân viên</p>
        </div>
        
        <div className="p-6">
          <NewsForm />
        </div>
      </div>
    </div>
  )
}
