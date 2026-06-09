import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { NewsForm } from '../../create/client-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditNewsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: post } = await supabase
    .from('news')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!post || post.author_id !== user.id) {
    return notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/news`} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 w-fit mb-4">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa bài viết</h1>
        <p className="text-slate-500 mt-1">Cập nhật nội dung hoặc đính kèm thêm tài liệu.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <NewsForm initialData={post} />
      </div>
    </div>
  )
}
