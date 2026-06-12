'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CompanionSelector({ allUsers, initialSelectedUsers = [] }: { allUsers: any[], initialSelectedUsers?: any[] }) {
  const [selectedUsers, setSelectedUsers] = useState<any[]>(initialSelectedUsers)
  const [tempSelectedUsers, setTempSelectedUsers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const openModal = () => {
    setTempSelectedUsers([...selectedUsers])
    setSearchQuery('')
    setIsModalOpen(true)
  }

  const handleSelectUser = (user: any) => {
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

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers || []
    return (allUsers || []).filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allUsers, searchQuery])

  return (
    <>
      <div className="space-y-2">
        <Label className="text-slate-700 font-semibold">Người đi cùng (Chọn từ danh bạ)</Label>
        
        {/* Hidden inputs to submit selected IDs */}
        {selectedUsers.map(user => (
          <input key={user.id} type="hidden" name="companions" value={user.id} />
        ))}

        <div className="border border-slate-200 rounded-md p-4 bg-slate-50 space-y-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={openModal}
          className="w-full bg-white text-[#1a56db] border-blue-200 hover:bg-blue-50"
        >
          Chọn người đi cùng
        </Button>

        {selectedUsers.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-sm font-medium text-slate-700">Đã chọn ({selectedUsers.length})</div>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-md shadow-sm">
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
      </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
          <div className="flex flex-col h-[80vh] max-h-[600px]">
            {/* Modal Header */}
            <DialogHeader className="p-4 border-b border-slate-100 flex flex-row justify-between items-center bg-white shrink-0 space-y-0">
              <DialogTitle className="text-lg font-bold text-slate-800">Chọn người đi cùng</DialogTitle>
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
