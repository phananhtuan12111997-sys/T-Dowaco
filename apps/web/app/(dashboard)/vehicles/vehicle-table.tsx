"use client"

import React, { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { User, Eye, CheckCircle, XCircle, Edit, Trash2, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateVehicleRequestStatus, deleteVehicleRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function StatusBadge({ status }: { status: string }) {
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

export function VehicleTable({ 
  requests, 
  isBanDieuHanh, 
  currentUserId, 
  usersMap = {}, 
  isITAdmin = false,
  isHR = false
}: { 
  requests: any[], 
  isBanDieuHanh: boolean, 
  currentUserId?: string, 
  usersMap?: Record<string, any>,
  isITAdmin?: boolean,
  isHR?: boolean
}) {
  const [selectedReq, setSelectedReq] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasAlertedSuccess = useRef(false)
  const hasAlertedEdit = useRef(false)

  // Theo dõi params mở dialog bằng ID (nếu cần)
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && requests) {
      const found = requests.find((r: any) => r.id === id || r.id === Number(id))
      if (found) {
        setSelectedReq(found)
      }
    }
  }, [searchParams, requests])

  // Cập nhật selectedReq nếu requests thay đổi từ server
  useEffect(() => {
    if (selectedReq && requests) {
      const found = requests.find((r: any) => r.id === selectedReq.id)
      if (found) {
        setSelectedReq(found)
      } else {
        setSelectedReq(null) // Nếu không còn trong danh sách thì đóng
      }
    }
  }, [requests]) // Removed selectedReq from dependencies to avoid infinite loops


  useEffect(() => {
    if (searchParams.get('success') === 'true' && !hasAlertedSuccess.current) {
      alert('Đã gửi đơn đăng ký xe thành công!')
      hasAlertedSuccess.current = true
      window.history.replaceState(null, '', '/vehicles')
    }
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('success') === 'edit' && !hasAlertedEdit.current) {
      alert('Đã cập nhật đơn đăng ký xe thành công!')
      hasAlertedEdit.current = true
      window.history.replaceState(null, '', '/vehicles')
    }
  }, [searchParams])

  const handleUpdateStatus = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateVehicleRequestStatus(id, status)
        alert(`Đã cập nhật trạng thái thành: ${status}`)
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
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  return (
    <>
      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">NGƯỜI ĐĂNG KÝ</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">THÔNG TIN CHUYẾN ĐI</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">THỜI GIAN</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">NGƯỜI DUYỆT</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">TRẠNG THÁI</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {requests && requests.length > 0 ? (
              requests.map((req) => (
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
                    <div className="text-slate-700 max-w-[250px]">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block cursor-help">{req.trip_purpose}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[400px] whitespace-normal break-words p-3 bg-slate-800 text-slate-50">
                            <p className="text-sm">{req.trip_purpose}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 whitespace-nowrap">
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
                  <td className="px-6 py-4 text-center text-slate-600 whitespace-nowrap">
                    {req.approver_id && usersMap[req.approver_id] ? (
                      <div className="font-medium text-slate-900">{usersMap[req.approver_id].full_name}</div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa xác định</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8 p-0"
                        onClick={() => setSelectedReq(req)}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {((currentUserId === req.created_by && req.status === 'Chờ duyệt') || isITAdmin || isHR) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-8 w-8 p-0"
                          asChild
                          title="Chỉnh sửa"
                        >
                          <Link href={`/vehicles/${req.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      
                      {((currentUserId === req.created_by && req.status === 'Chờ duyệt') || isITAdmin) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                          disabled={isPending}
                          onClick={(e) => handleDelete(req.id, e)}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Không tìm thấy dữ liệu nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 shadow-lg">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-[#1a56db]">Chi tiết phiếu đăng ký xe</DialogTitle>
          </DialogHeader>
          
          {selectedReq && (
            <div className="p-6 space-y-6">
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
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-slate-800 text-sm leading-relaxed">
                  {selectedReq.trip_purpose}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Thời gian đi</h4>
                  <p className="text-slate-900 font-medium">
                    {new Date(selectedReq.start_time).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Thời gian về</h4>
                  <p className="text-slate-900 font-medium">
                    {selectedReq.end_time ? new Date(selectedReq.end_time).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    }) : 'Chưa xác định'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Phương tiện & Tài xế</h4>
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-100 text-blue-900 font-medium text-sm">
                    {selectedReq.vehicle_info || 'Chưa phân công xe và tài xế'}
                  </div>
                </div>
              </div>

              {selectedReq.companions && selectedReq.companions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Danh sách người đi cùng</h4>
                  <div className="flex flex-wrap gap-2">
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

              {((isBanDieuHanh || isITAdmin) && selectedReq.status === 'Chờ duyệt') && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
    </>
  )
}
