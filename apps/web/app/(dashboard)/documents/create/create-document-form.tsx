'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, Star, Paperclip, AlertCircle, UserPlus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { createDocument } from './actions'

type User = {
  id: string;
  full_name: string;
  department?: string;
  role?: string;
  avatar_url?: string;
}

interface CreateDocumentFormProps {
  users: User[]
}

export function CreateDocumentForm({ users }: CreateDocumentFormProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedUsers, setTempSelectedUsers] = useState<User[]>([])
  
  const [isPriority, setIsPriority] = useState(false)
  const [isSendAll, setIsSendAll] = useState(false)
  
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    
    if (file) {
      // Check 500MB limit (500 * 1024 * 1024 bytes)
      if (file.size > 500 * 1024 * 1024) {
        setFileError('File vượt quá dung lượng tối đa 500MB.')
        setFileName(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setFileName(file.name)
      }
    } else {
      setFileName(null)
    }
  }

  // Handle priority toggle -> Auto select "Ban điều hành"
  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsPriority(checked)
    
    if (checked) {
      const execUsers = users.filter(u => u.department === 'Ban điều hành')
      // Add to selected users avoiding duplicates
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
      setSelectedUsers(users)
    } else {
      // Option: clear users when unchecked, or keep them. Let's keep existing, but uncheck means they can remove.
      // Usually turning off send all means clearing the list
      setSelectedUsers([])
      setIsPriority(false) // Uncheck priority as well if we clear
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

  return (
    <>
      <form action={createDocument}>
        {/* Hidden input to pass selected users array to Server Action */}
        <input type="hidden" name="selected_users" value={JSON.stringify(selectedUsers.map(u => u.id))} />
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>T-Dowaco</span>
              <span>→</span>
              <span>Soạn văn bản</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Phát hành công văn mới</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button type="button" variant="outline" className="w-full md:w-auto bg-slate-50 hover:bg-slate-100" asChild>
              <Link href="/documents/incoming">Hủy bỏ</Link>
            </Button>
            <Button type="submit" className="bg-[#1a56db] hover:bg-blue-700 w-full md:w-auto shadow-sm">
              <Send className="w-4 h-4 mr-2" /> Gửi công văn
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-slate-700 font-medium">Loại văn bản <span className="text-red-500">*</span></Label>
                    <Select name="type" required>
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
                    <Input id="symbol_number" name="symbol_number" placeholder="VD: 01/CV-CTY" required className="bg-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-slate-700 font-medium">Trích yếu <span className="text-red-500">*</span></Label>
                  <Input 
                    id="summary" 
                    name="summary" 
                    placeholder="Tóm tắt ngắn gọn nội dung công văn..." 
                    className="bg-white"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-slate-700 font-medium">Nội dung chi tiết</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    placeholder="Nhập nội dung đầy đủ..." 
                    className="min-h-[150px] bg-white resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1a56db] font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Tệp đính kèm (Tối đa 500MB/file)
                  </Label>
                  <div className={`flex flex-col gap-2 border rounded-md p-3 ${fileError ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="attachment" className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors inline-block text-center">
                        Chọn tệp
                      </Label>
                      <Input 
                        id="attachment" 
                        type="file" 
                        name="attachment"
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <span className="text-sm text-slate-500 flex-1 truncate">
                        {fileName ? fileName : 'Không có tệp nào được chọn'}
                      </span>
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
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1a56db]"></div>
                    </label>
                    <span className="text-sm font-bold text-slate-700 uppercase">GỬI TOÀN CÔNG TY</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-12">Nếu bật, văn bản sẽ gửi đến tất cả nhân viên.</p>
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
                              <p className="text-xs text-slate-500 truncate">{user.department || 'Chưa có phòng ban'}</p>
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
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Chọn người nhận văn bản</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                              <p className="text-xs text-slate-500">{user.department || 'Chưa có phòng ban'}</p>
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
