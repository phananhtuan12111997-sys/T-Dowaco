import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsFeed } from './NewsFeed'

export default async function NewsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('department, is_admin')
    .eq('id', user.id)
    .single()

  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin
  const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')
  const canPostNews = profile?.is_admin || isHR

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-2xl mx-auto mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Bảng tin nội bộ</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Bản tin công ty</h1>
        </div>
        
        {canPostNews && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto shadow-sm rounded-full px-6">
            <Link href="/news/create">
              <Plus className="mr-2 h-4 w-4" /> Đăng tin mới
            </Link>
          </Button>
        )}
      </div>

      <NewsFeed initialPosts={[]} currentUserId={user.id} isITAdmin={isITAdmin} />
    </div>
  )
}
