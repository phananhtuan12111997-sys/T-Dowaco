'use client'

import React, { useState } from 'react'

type Profile = {
  id: string
  full_name: string
  department: string
  role: string
}

export function MeetingParticipantsSelector({ 
  profiles, 
  isFullAccess, 
  userDepartment 
}: { 
  profiles: Profile[], 
  isFullAccess: boolean, 
  userDepartment: string 
}) {
  // Group profiles by department
  const departmentsMap = profiles.reduce((acc, profile) => {
    if (!profile.department) return acc;
    const dept = profile.department || 'Khác';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(profile);
    return acc;
  }, {} as Record<string, Profile[]>);

  // Default departments
  const defaultDepartments = [
    'Ban điều hành',
    'Phòng tổ chức Hành chánh',
    'Phòng Tài chính Kế toán',
    'Phòng IT',
    'Phòng Kế hoạch Kỹ thuật',
    'Phòng Kinh Doanh',
    'Đội xây lắp - Chống thất thoát',
    'Phân xưởng sản xuất'
  ];

  // Merge available departments
  const allDepts = Array.from(new Set([...defaultDepartments, ...Object.keys(departmentsMap)]));

  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Determine which departments to show based on access
  const visibleDepts = isFullAccess ? allDepts : [userDepartment].filter(Boolean);

  const toggleDept = (dept: string) => {
    setSelectAll(false);
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter(d => d !== dept));
      // Optionally deselect all users in this dept too
      const deptUserIds = (departmentsMap[dept] || []).map(u => u.id);
      setSelectedUsers(selectedUsers.filter(id => !deptUserIds.includes(id)));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const toggleUser = (userId: string, dept: string) => {
    setSelectAll(false);
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      // If dept was fully selected, unselect it since one user is unselected
      if (selectedDepts.includes(dept)) {
        setSelectedDepts(selectedDepts.filter(d => d !== dept));
        // Add back all other users in this dept
        const otherUserIds = (departmentsMap[dept] || [])
          .map(u => u.id)
          .filter(id => id !== userId);
        setSelectedUsers(prev => [...new Set([...prev, ...otherUserIds])]);
      }
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const toggleExpand = (dept: string) => {
    if (expandedDepts.includes(dept)) {
      setExpandedDepts(expandedDepts.filter(d => d !== dept));
    } else {
      setExpandedDepts([...expandedDepts, dept]);
    }
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedDepts([]);
      setSelectedUsers([]);
    } else {
      setSelectAll(true);
      setSelectedDepts([]);
      setSelectedUsers([]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden inputs to submit standard form data */}
      {selectAll && <input type="hidden" name="departments" value="Tất cả" />}
      {!selectAll && selectedDepts.map(dept => (
        <input key={dept} type="hidden" name="departments" value={dept} />
      ))}
      {!selectAll && selectedUsers.map(userId => (
        <input key={`u-${userId}`} type="hidden" name="departments" value={userId} />
      ))}

      {isFullAccess && (
        <div className="flex items-center space-x-2 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
          <input 
            type="checkbox" 
            id="dept_all" 
            checked={selectAll}
            onChange={toggleAll}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
          />
          <label htmlFor="dept_all" className="text-sm font-semibold leading-none cursor-pointer text-slate-800">
            Tất cả phòng ban
          </label>
        </div>
      )}

      {!selectAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {visibleDepts.map(dept => {
            const isDeptSelected = selectedDepts.includes(dept);
            const deptUsers = departmentsMap[dept] || [];
            const isExpanded = expandedDepts.includes(dept);
            const hasUsers = deptUsers.length > 0;

            return (
              <div key={dept} className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                <div className="p-3 flex items-center justify-between hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`dept_${dept}`}
                      checked={isDeptSelected || (hasUsers && deptUsers.every(u => selectedUsers.includes(u.id)))}
                      onChange={() => toggleDept(dept)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor={`dept_${dept}`} className="text-sm font-medium leading-none cursor-pointer">
                      {dept}
                    </label>
                  </div>
                  {hasUsers && (
                    <button 
                      type="button" 
                      onClick={() => toggleExpand(dept)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                    >
                      {isExpanded ? 'Ẩn' : 'Chi tiết'}
                    </button>
                  )}
                </div>
                
                {isExpanded && hasUsers && (
                  <div className="bg-white border-t border-slate-200 p-2 space-y-2">
                    {deptUsers.map(user => {
                      const isUserSelected = isDeptSelected || selectedUsers.includes(user.id);
                      return (
                        <div key={user.id} className="flex items-center space-x-2 pl-6 py-1 hover:bg-slate-50 rounded">
                          <input 
                            type="checkbox" 
                            id={`user_${user.id}`}
                            checked={isUserSelected}
                            onChange={() => toggleUser(user.id, dept)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer" 
                          />
                          <label htmlFor={`user_${user.id}`} className="text-sm text-slate-600 cursor-pointer flex-1">
                            {user.full_name || 'Chưa cập nhật tên'} <span className="text-xs text-slate-400">({user.role || 'Chưa phân quyền'})</span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
