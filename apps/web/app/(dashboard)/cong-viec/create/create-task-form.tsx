'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Send, AlertCircle, Loader2, UserPlus, Search, X, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTask } from '../actions'

type User = {
  id: string;
  full_name: string;
  department?: string;
  role?: string;
  avatar_url?: string;
}

interface CreateTaskFormProps {
  users: User[]
  currentUserId: string
}

export function CreateTaskForm({ users, currentUserId }: CreateTaskFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedUsers, setTempSelectedUsers] = useState<User[]>([])
  
  const [fileError, setFileError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Xử lý đính kèm file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setFileError(null)
    
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      const validFiles: File[] = []
      
      let hasError = false
      newFiles.forEach(file => {
        if (file.size > 500 * 1024 * 1024) { // 500MB
          setFileError('Một hoặc nhiều file vượt quá dung lượng tối đa 500MB.')
          hasError = true
        } else {
          validFiles.push(file)
        }
      })
      
      setSelectedFiles(prev => [...prev, ...validFiles])
      
      if (hasError && fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Xử lý modal chọn người dùng
  const openModal = () => {
    setTempSelectedUsers([...selectedUsers])
    setSearchQuery('')
    setIsModalOpen(true)
  }

  const handleSelectUser = (user: User) => {
    if (!tempSelectedUsers.some(u => u.id === user.id)) {
      setTempSelectedUsers([...tempSelectedUsers, user])
    }
  }

  const handleRemoveTempUser = (userId: string) => {
    setTempSelectedUsers(tempSelectedUsers.filter(u => u.id !== userId))
  }

  const handleRemoveSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const confirmSelection = () => {
    setSelectedUsers([...tempSelectedUsers])
    setIsModalOpen(false)
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(u => u.id !== currentUserId)

  // Xử lý gửi form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một người nhận việc.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      
      // Thêm selected_users vào form
      formData.append('selected_users', JSON.stringify(selectedUsers.map(u => u.id)))
      
      // Thêm files
      selectedFiles.forEach(file => {
        formData.append('attachments', file)
      })

      const res = await createTask(formData)
      if (res?.success) {
        alert('Giao công việc thành công!')
        window.location.href = '/cong-viec/da-giao'
        return // Đợi chuyển trang, không reset loading
      } else if (res?.error) {
        alert('Có lỗi xảy ra: ' + res.error)
      }
    } catch (e) {
      console.error(e)
    }
    setIsLoading(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>LKWA</span>
              <span>→</span>
              <Link href="/cong-viec/duoc-giao" className="hover:text-[#1a56db]">Quản lý công việc</Link>
              <span>→</span>
              <span>Giao việc mới</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Khởi tạo & Giao việc</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button type="button" variant="outline" className="w-full md:w-auto bg-slate-50 hover:bg-slate-100" asChild>
              <Link href="/cong-viec/duoc-giao">Hủy bỏ</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#1a56db] hover:bg-blue-700 w-full md:w-auto shadow-sm">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} 
              {isLoading ? 'Đang giao việc...' : 'Giao việc'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Nội dung công việc */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">Nội dung công việc</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700 font-medium">Tên công việc <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Nhập tên ngắn gọn cho công việc..." 
                    required 
                    className="bg-white border-slate-200 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700 font-medium">Mô tả chi tiết <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Nhập nội dung, yêu cầu, mục tiêu chi tiết..." 
                    required 
                    className="min-h-[150px] bg-white border-slate-200 focus-visible:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-slate-700 font-medium">Độ ưu tiên <span className="text-red-500">*</span></Label>
                    <Select name="priority" defaultValue="Bình thường">
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Chọn mức độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bình thường">Bình thường</SelectItem>
                        <SelectItem value="Quan trọng">Quan trọng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="due_date" className="text-slate-700 font-medium">Thời hạn hoàn thành <span className="text-red-500">*</span></Label>
                    <Input 
                      id="due_date" 
                      name="due_date" 
                      type="date"
                      required
                      className="bg-white border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-3 pt-2">
                  <Label className="text-slate-700 font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-500" /> Tệp đính kèm
                  </Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center relative">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      multiple
                      onChange={handleFileChange}
                    />
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-semibold text-[#1a56db]">Nhấn để tải lên</span> hoặc kéo thả file vào đây
                    </p>
                    <p className="text-xs text-slate-400">Hỗ trợ mọi định dạng (Tối đa 500MB)</p>
                  </div>
                  
                  {fileError && <p className="text-sm text-red-500">{fileError}</p>}
                  
                  {selectedFiles.length > 0 && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">Tệp đã chọn:</h4>
                      <ul className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded text-sm">
                            <span className="truncate max-w-[80%] text-slate-600">{file.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                              <button 
                                type="button" 
                                onClick={() => removeFile(index)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Phân công */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">Chọn người nhận</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-700 font-medium">Người thực hiện công việc</Label>
                    <Button type="button" variant="outline" size="sm" onClick={openModal} className="h-8 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium">
                      <UserPlus className="w-4 h-4 mr-1.5" /> Chọn người
                    </Button>
                  </div>
                  
                  {selectedUsers.length > 0 ? (
                    <div className="border border-slate-200 rounded-md p-3 max-h-[300px] overflow-y-auto space-y-2 bg-slate-50">
                      {selectedUsers.map(user => (
                        <div key={user.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-sm">
                          <div className="truncate pr-2">
                            <div className="font-medium text-slate-700 truncate">{user.full_name}</div>
                            {user.department && <div className="text-xs text-slate-500 truncate">{user.department}</div>}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSelectedUser(user.id)}
                            className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-md p-6 flex flex-col items-center text-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                      <p className="text-sm font-medium text-slate-700">Chưa chọn người nhận</p>
                      <p className="text-xs text-slate-500 mt-1">Bấm nút "Chọn" ở trên để giao việc cho các cá nhân.</p>
                    </div>
                  )}
                </div>
                
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Modal Chọn người dùng */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
          <div className="flex flex-col h-[80vh] max-h-[600px]">
            {/* Modal Header */}
            <DialogHeader className="p-4 border-b border-slate-100 flex flex-row justify-between items-center bg-white shrink-0 space-y-0">
              <DialogTitle className="text-lg font-bold text-slate-800">Chọn người nhận việc</DialogTitle>
            </DialogHeader>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Column: Search & List */}
              <div className="w-3/5 border-r border-slate-100 flex flex-col bg-white">
                <div className="flex border-b border-slate-100">
                  <button className="flex-1 py-3 text-sm font-medium text-slate-800 border-b-2 border-[#1a56db]">Tìm cá nhân</button>
                  <button className="flex-1 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50">Chọn Danh bạ</button>
                </div>
                
                <div className="p-4 shrink-0">
                  <div className="relative">
                    <Input 
                      placeholder="Nhập tên nhân viên..." 
                      className="pr-10 bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-[#1a56db] rounded-r-md cursor-pointer">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-4">Không tìm thấy nhân viên nào</div>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = tempSelectedUsers.some(u => u.id === user.id)
                      return (
                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.full_name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
                              <p className="text-xs text-slate-500">{user.department || 'Chưa có phòng ban'}{user.role ? ` - ${user.role}` : ''}</p>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => isSelected ? handleRemoveTempUser(user.id) : handleSelectUser(user)}
                            className={`h-8 px-3 rounded-md border shadow-sm ${
                              isSelected 
                                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' 
                                : 'bg-white text-[#1a56db] border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            {isSelected ? 'Đã chọn' : '+ Chọn'}
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Selected */}
              <div className="w-2/5 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 shrink-0">
                  <h3 className="text-sm font-semibold text-slate-800">Đã chọn ({tempSelectedUsers.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {tempSelectedUsers.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 mt-10">Chưa chọn nhân viên nào</div>
                  ) : (
                    tempSelectedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-slate-600 overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.full_name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate">{user.full_name}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveTempUser(user.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="button" onClick={confirmSelection} className="bg-[#5c67f2] hover:bg-indigo-600 text-white">
                ✓ Xác nhận chọn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
