"use client"

import React, { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, User, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, Edit, Trash2, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateVehicleRequestStatus, deleteVehicleRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Chờ duyệt':
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Chờ duyệt</Badge>
    case 'Đã duyệt':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Đã duyệt</Badge>
    case 'Từ chối':
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Từ chối</Badge>
    case 'Đã hoàn thành':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Đã hoàn thành</Badge>
    default:
      return <Badge variant="outline">{status || 'Chờ duyệt'}</Badge>
  }
}

export function VehicleClient({ requests, isBanDieuHanh, currentUserId, usersMap = {}, currentPage = 1, totalPages = 1, isITAdmin = false }: { requests: any[], isBanDieuHanh: boolean, currentUserId?: string, usersMap?: Record<string, any>, currentPage?: number, totalPages?: number, isITAdmin?: boolean }) {
  const [search, setSearch] = useState('')
  const [selectedReq, setSelectedReq] = useState<any>(null)
  const [localRequests, setLocalRequests] = useState<any[]>(requests || [])
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    setLocalRequests(requests || [])
  }, [requests])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-vehicle-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_requests' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setLocalRequests((prev) => prev.map((req) => req.id === payload.new.id ? { ...req, ...payload.new } : req))
          setSelectedReq((prev: any) => {
            if (prev && prev.id === payload.new.id) {
              return { ...prev, ...payload.new }
            }
            return prev
          })
        } else if (payload.eventType === 'INSERT') {
          setLocalRequests((prev) => [payload.new, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setLocalRequests((prev) => prev.filter((req) => req.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const hasAlertedSuccess = React.useRef(false)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id && requests) {
      const found = requests.find((r: any) => r.id === id || r.id === Number(id))
      if (found) {
        setSelectedReq(found)
      }
    }
  }, [searchParams, requests])

  useEffect(() => {
    if (searchParams.get('success') === 'true' && !hasAlertedSuccess.current) {
      alert('Đã gửi đơn đăng ký xe thành công!')
      hasAlertedSuccess.current = true
      window.history.replaceState(null, '', '/vehicles')
    }
  }, [searchParams])

  const handleUpdateStatus = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateVehicleRequestStatus(id, status)
        alert(`Đã cập nhật trạng thái thành: ${status}`)
        setSelectedReq((prev: any) => ({ ...prev, status }))
        router.refresh()
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn xin xe này?')) return

    startTransition(async () => {
      try {
        await deleteVehicleRequest(id)
        alert('Đã xóa đơn thành công!')
        router.refresh()
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  const hasAlertedEdit = useRef(false)

  useEffect(() => {
    if (searchParams.get('success') === 'edit' && !hasAlertedEdit.current) {
      alert('Đã cập nhật đơn đăng ký xe thành công!')
      hasAlertedEdit.current = true
      window.history.replaceState(null, '', '/vehicles')
    }
  }, [searchParams])

  const filteredRequests = localRequests.filter(req => 
    req.requester_name?.toLowerCase().includes(search.toLowerCase()) ||
    req.trip_purpose?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKW</span>
            <span>→</span>
            <span>Quản lý xin xe</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Hệ thống Đăng ký Xe</h1>
        </div>
        
        {!isBanDieuHanh && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
            <Link href="/vehicles/create">
              <Plus className="mr-2 h-4 w-4" /> Đăng ký xe mới
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-end">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm nhanh..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">NGƯỜI ĐĂNG KÝ</th>
                <th className="px-6 py-4 font-medium">THÔNG TIN CHUYẾN ĐI</th>
                <th className="px-6 py-4 font-medium text-center">THỜI GIAN</th>
                <th className="px-6 py-4 font-medium text-center">NGƯỜI DUYỆT</th>
                <th className="px-6 py-4 font-medium text-center">TRẠNG THÁI</th>
                <th className="px-6 py-4 font-medium text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests && filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedReq(req)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-900">{req.requester_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 max-w-xs">{req.trip_purpose}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      <div>
                        <span className="text-slate-400 text-xs mr-1">Đi:</span> 
                        {new Date(req.start_time).toLocaleString('vi-VN', {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </div>
                      {req.end_time && (
                        <div className="mt-1">
                          <span className="text-slate-400 text-xs mr-1">Về:</span> 
                          {new Date(req.end_time).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {req.approver_id && usersMap[req.approver_id] ? (
                        <div className="font-medium text-slate-900">{usersMap[req.approver_id].full_name}</div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa xác định</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => setSelectedReq(req)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Xem
                        </Button>
                        
                        {((currentUserId === req.created_by && req.status === 'Chờ duyệt') || isITAdmin) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            asChild
                          >
                            <Link href={`/vehicles/${req.id}/edit`}>
                              <Edit className="mr-1 h-4 w-4" />
                              Sửa
                            </Link>
                          </Button>
                        )}
                        
                        {(currentUserId === req.created_by && req.status === 'Chờ duyệt' || isITAdmin) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            disabled={isPending}
                            onClick={(e) => handleDelete(req.id, e)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Xóa
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy dữ liệu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    className="rounded-l-md rounded-r-none"
                    disabled={currentPage <= 1}
                    asChild={currentPage > 1}
                  >
                    {currentPage > 1 ? (
                      <Link href={`/vehicles?page=${currentPage - 1}`}>
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <div>
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-r-md rounded-l-none"
                    disabled={currentPage >= totalPages}
                    asChild={currentPage < totalPages}
                  >
                    {currentPage < totalPages ? (
                      <Link href={`/vehicles?page=${currentPage + 1}`}>
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <div>
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-700 border-b pb-3">Chi tiết phiếu đăng ký xe</DialogTitle>
          </DialogHeader>
          
          {selectedReq && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Người đăng ký</h4>
                  <p className="font-semibold text-slate-900">{selectedReq.requester_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Trạng thái</h4>
                  <StatusBadge status={selectedReq.status} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Thông tin chuyến đi (Nơi đến / Mục đích)</h4>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-slate-800">
                  {selectedReq.trip_purpose}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Thời gian đi</h4>
                  <p className="text-slate-900">
                    {new Date(selectedReq.start_time).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Thời gian về</h4>
                  <p className="text-slate-900">
                    {selectedReq.end_time ? new Date(selectedReq.end_time).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    }) : 'Chưa xác định'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Phương tiện & Tài xế</h4>
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-slate-800">
                    {selectedReq.vehicle_info || 'Chưa có thông tin'}
                  </div>
                </div>
              </div>

              {selectedReq.companions && selectedReq.companions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Danh sách người đi cùng</h4>
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex flex-wrap gap-2">
                    {selectedReq.companions.map((compId: string) => {
                      const companionUser = usersMap[compId];
                      return companionUser ? (
                        <div key={compId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-sm font-medium text-slate-700">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{companionUser.full_name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {(isBanDieuHanh || isITAdmin) && selectedReq.status === 'Chờ duyệt' && (
                <div className="pt-4 border-t flex items-center justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Từ chối')}
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Từ chối
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isPending}
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Đã duyệt')}
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Phê duyệt
                  </Button>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
