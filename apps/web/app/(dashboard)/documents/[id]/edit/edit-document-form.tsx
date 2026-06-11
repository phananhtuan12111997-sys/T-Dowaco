'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Send, Star, Paperclip, AlertCircle, UserPlus, Search, X, Loader2 } from 'lucide-react'
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
import { updateDocument } from '@/app/actions/documents'

type User = {
  id: string;
  full_name: string;
  department?: string;
  role?: string;
  avatar_url?: string;
}

interface EditDocumentFormProps {
  users: User[]
  currentUserId: string
  documentId: string
  initialData: any
}

export function EditDocumentForm({ users, currentUserId, documentId, initialData }: EditDocumentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>(initialData.selectedUsers || [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedUsers, setTempSelectedUsers] = useState<User[]>([])
  
  const [isPriority, setIsPriority] = useState(initialData.priority || false)
  const [isSendAll, setIsSendAll] = useState(initialData.selectedUsers?.length === users.length - 1)
  
  const [fileError, setFileError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<any[]>(initialData.attachments || [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setFileError(null)
    
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      const validFiles: File[] = []
      
      let hasError = false
      newFiles.forEach(file => {
        // Check 500MB limit
        if (file.size > 500 * 1024 * 1024) {
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

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Handle priority toggle
  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsPriority(checked)
    
    if (checked) {
      const execUsers = users.filter(u => u.department === 'Ban điều hành')
      setSelectedUsers(prev => {
        const newUsers = [...prev]
        execUsers.forEach(eu => {
          if (!newUsers.some(u => u.id === eu.id)) newUsers.push(eu)
        })
        return newUsers
      })
    }
  }

  // Handle send all toggle
  const handleSendAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsSendAll(checked)
    
    if (checked) {
      setSelectedUsers(users.filter(u => u.id !== currentUserId))
    } else {
      setSelectedUsers([])
      setIsPriority(false)
    }
  }

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
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn người nhận.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.delete('attachments')
      selectedFiles.forEach(file => {
        formData.append('attachments', file)
      })
      
      formData.append('existing_attachments', JSON.stringify(existingAttachments))
      
      const res = await updateDocument(documentId, formData)
      if (res?.success) {
        alert('Cập nhật công văn thành công!')
        router.push('/documents/sent')
        router.refresh()
      } else if (res?.error) {
        alert('Có lỗi xảy ra: ' + res.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Hidden input to pass selected users array to Server Action */}
        <input type="hidden" name="selected_users" value={JSON.stringify(selectedUsers.map(u => u.id))} />
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>LKWA</span>
              <span>→</span>
              <span>Sửa công văn đã gửi</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Chỉnh sửa công văn</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button type="button" variant="outline" className="w-full md:w-auto bg-slate-50 hover:bg-slate-100" asChild>
              <Link href="/documents/sent">Hủy bỏ</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#1a56db] hover:bg-blue-700 w-full md:w-auto shadow-sm">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} 
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Nội dung văn bản */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">Nội dung văn bản</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-slate-700 font-medium">Loại văn bản <span className="text-red-500">*</span></Label>
                    <Select name="type" required defaultValue={initialData.type}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="-- Chọn loại văn bản --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Báo cáo">Báo cáo</SelectItem>
                        <SelectItem value="Biên bản">Biên bản</SelectItem>
                        <SelectItem value="Công đoàn">Công đoàn</SelectItem>
                        <SelectItem value="Công văn">Công văn</SelectItem>
                        <SelectItem value="CV đến đơn thư">CV đến đơn thư</SelectItem>
                        <SelectItem value="CV đến thư mời">CV đến thư mời</SelectItem>
                        <SelectItem value="CV khác">CV khác</SelectItem>
                        <SelectItem value="CV từ Ban ngành">CV từ Ban ngành</SelectItem>
                        <SelectItem value="CV từ Cty khác">CV từ Cty khác</SelectItem>
                        <SelectItem value="CV từ Sở">CV từ Sở</SelectItem>
                        <SelectItem value="CV từ UBND">CV từ UBND</SelectItem>
                        <SelectItem value="Đảng">Đảng</SelectItem>
                        <SelectItem value="Phiếu phối hợp">Phiếu phối hợp</SelectItem>
                        <SelectItem value="Quyết định">Quyết định</SelectItem>
                        <SelectItem value="Thông báo">Thông báo</SelectItem>
                        <SelectItem value="Thư mời">Thư mời</SelectItem>
                        <SelectItem value="Tờ trình">Tờ trình</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="symbol_number" className="text-slate-700 font-medium">Số ký hiệu <span className="text-red-500">*</span></Label>
                    <Input id="symbol_number" name="symbol_number" defaultValue={initialData.symbol_number} required className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency" className="text-slate-700 font-medium">Độ ưu tiên <span className="text-red-500">*</span></Label>
                    <Select name="urgency" required defaultValue={initialData.priority ? "Quan trọng" : "Bình thường"}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Chọn độ ưu tiên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bình thường">Bình thường</SelectItem>
                        <SelectItem value="Quan trọng">Quan trọng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-slate-700 font-medium">Trích yếu <span className="text-red-500">*</span></Label>
                  <Input 
                    id="summary" 
                    name="summary" 
                    defaultValue={initialData.summary}
                    className="bg-white"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-slate-700 font-medium">Nội dung chi tiết</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    defaultValue={initialData.content || ''}
                    className="min-h-[150px] bg-white resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1a56db] font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Tệp đính kèm (Tối đa 500MB/file)
                  </Label>
                  <div className={`flex flex-col gap-2 border rounded-md p-3 ${fileError ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50/50'}`}>
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label htmlFor="attachment" className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors inline-block text-center">
                          Thêm tệp
                        </Label>
                        <Input 
                          id="attachment" 
                          type="file" 
                          name="attachments"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      {(existingAttachments.length > 0 || selectedFiles.length > 0) ? (
                        <div className="flex flex-col gap-2 mt-2">
                          {existingAttachments.map((f, i) => (
                            <div key={`existing-${i}`} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md">
                              <span className="text-sm text-slate-700 truncate">{f.name} (Đã tải lên)</span>
                              <button 
                                type="button" 
                                onClick={() => removeExistingAttachment(i)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {selectedFiles.map((f, i) => (
                            <div key={`new-${i}`} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md">
                              <span className="text-sm text-slate-700 truncate">{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                              <button 
                                type="button" 
                                onClick={() => removeFile(i)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">
                          Chưa có tệp nào
                        </span>
                      )}
                    </div>
                    {fileError && <span className="text-sm text-red-500 font-medium">{fileError}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cột phải: Tùy chọn */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">Tùy chọn phát hành</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                {/* Custom Toggle: Quan trọng */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="priority" 
                      className="sr-only peer" 
                      checked={isPriority}
                      onChange={handlePriorityChange}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-amber-600">Đánh dấu Quan trọng</span>
                  </div>
                </div>

                {/* Custom Toggle: Gửi toàn công ty */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="send_all" 
                        className="sr-only peer" 
                        checked={isSendAll}
                        onChange={handleSendAllChange}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                    <span className="text-sm font-bold text-red-600 uppercase">GỬI TOÀN CÔNG TY</span>
                  </div>
                  <p className="text-xs text-red-500 pl-12">Nếu bật, văn bản sẽ gửi đến tất cả nhân viên.</p>
                </div>

              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-800">Người nhận đích danh</CardTitle>
                <Button type="button" onClick={openModal} variant="outline" size="sm" className="h-8 text-[#1a56db] border-blue-200 hover:bg-blue-50">
                  <UserPlus className="w-4 h-4 mr-2" /> Chọn người
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {selectedUsers.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                    <p className="text-sm text-slate-500">Vui lòng chọn người nhận.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-700">Đã chọn ({selectedUsers.length})</div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {selectedUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-md">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-slate-600 overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.full_name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-slate-800 truncate">{user.full_name}</p>
                              <p className="text-xs text-slate-500 truncate">{user.department || 'Chưa có phòng ban'}{user.role ? ` - ${user.role}` : ''}</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSelectedUser(user.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* User Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
          <div className="flex flex-col h-[80vh] max-h-[600px]">
            {/* Modal Header */}
            <DialogHeader className="p-4 border-b border-slate-100 flex flex-row justify-between items-center bg-white shrink-0 space-y-0">
              <DialogTitle className="text-lg font-bold text-slate-800">Chọn người nhận văn bản</DialogTitle>
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
              <Button type="button" onClick={confirmSelection} className="bg-[#5c67f2] hover:bg-indigo-600">
                ✓ Xác nhận chọn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
