'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, X, Users, Forward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { forwardDocument } from '../../workflow-actions'

interface User {
  id: string
  full_name: string | null
  department: string | null
  role: string | null
  avatar_url: string | null
}

interface ForwardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  users: User[]
}

export function ForwardModal({ open, onOpenChange, documentId, users }: ForwardModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(user => 
      user.full_name?.toLowerCase().includes(query) || 
      user.department?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const handleForward = async () => {
    if (selectedUsers.length === 0) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await forwardDocument(documentId, selectedUsers.map(u => u.id))
      if (result?.error) {
        setError(result.error)
      } else {
        setSelectedUsers([])
        setSearchQuery('')
        onOpenChange(false)
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi chuyển tiếp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex flex-col h-[80vh] max-h-[600px]">
          {/* Modal Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2 m-0 p-0 border-0">
              <Forward className="w-5 h-5 text-blue-600" />
              Chọn người nhận để chuyển tiếp
            </DialogTitle>
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
                  <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-[#5c67f2] rounded-r-md cursor-pointer">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-4">Không tìm thấy nhân viên nào</div>
                ) : (
                  filteredUsers.map(user => {
                    const isSelected = selectedUsers.some(u => u.id === user.id)
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
                          onClick={() => isSelected ? handleRemoveUser(user.id) : handleSelectUser(user)}
                          className={`h-8 px-3 rounded-md border shadow-sm ${
                            isSelected 
                              ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' 
                              : 'bg-white text-[#5c67f2] border-indigo-200 hover:bg-indigo-50'
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
                <h3 className="text-sm font-semibold text-slate-800">Đã chọn ({selectedUsers.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedUsers.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 mt-10">Chưa chọn nhân viên nào</div>
                ) : (
                  selectedUsers.map(user => (
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
                        onClick={() => handleRemoveUser(user.id)}
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
          <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="text-sm text-red-500">{error}</div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button 
                type="button" 
                onClick={handleForward} 
                disabled={selectedUsers.length === 0 || loading}
                className="bg-[#8b93ff] hover:bg-indigo-400 text-white"
              >
                {loading ? 'Đang gửi...' : '✓ Xác nhận chọn'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
