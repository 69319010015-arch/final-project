import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, ShieldAlert, Check, ShieldCheck } from 'lucide-react';

export const UserSettingsPage = () => {
  const { updateUserProfile, currentUser } = useAuth();
  const [editingUserId, setEditingUserId] = useState(null);

  // Live query users from DB
  const users = useLiveQuery(async () => {
    return await db.users.toArray();
  });

  const handleRoleChange = async (user, newRole) => {
    try {
      const updatedUser = {
        ...user,
        role: newRole
      };
      
      await updateUserProfile(updatedUser);
      alert(`อัปเดตบทบาทของ "${user.fullName.split(' ')[0]}" เป็น ${newRole.toUpperCase()} เรียบร้อยแล้ว`);
      
      // If editing role of current logged-in user, it will reactively update the layout!
      if (currentUser.id === user.id && currentUser.role !== newRole) {
        window.location.reload(); // Refresh layout to apply new navigation permissions
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอัปเดตสิทธิ์ผู้ใช้ได้');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/30';
      case 'technician':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/30';
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-500" />
          จัดการสิทธิ์ผู้ใช้งานในระบบ (IT Administration)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          ผู้ดูแลระบบสามารถปรับเปลี่ยนระดับสิทธิ์ สลับบทบาทผู้ใช้งานทั่วไป ช่างเทคนิคซัพพอร์ต และแอดมิน เพื่อจำลองสิทธิ์ได้ที่นี่
        </p>
      </div>

      {/* Warning Banner */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/10 text-xs text-rose-600 dark:text-rose-455 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">คำแนะนำสำหรับโหมดทดสอบระบบ (Demo Simulation Notice)</p>
          <p className="leading-relaxed">
            เมื่อคุณทำการสลับเปลี่ยนสิทธิ์ของผู้ใช้งานในระบบ ตารางนำทางและสิทธิ์การเห็นตั๋วปัญหาจะได้รับการปรับเปลี่ยนตามทันที
            หากคุณเปลี่ยนสิทธิ์ของตนเอง (บัญชีที่คุณกำลังล็อกอินอยู่) ระบบจะรีเฟรชหน้าจอออโต้เพื่อรีเซ็ตเมนูแถบข้างให้ถูกต้อง
          </p>
        </div>
      </div>

      {/* Users table */}
      {!users ? (
        <div className="flex h-44 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-950 font-semibold text-slate-750 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">ผู้ใช้งาน (User Profile)</th>
                <th scope="col" className="px-6 py-4">ชื่อล็อกอิน (Username)</th>
                <th scope="col" className="px-6 py-4">ระดับสิทธิ์ (Current Role)</th>
                <th scope="col" className="px-6 py-4 text-right">แก้ไขสิทธิ์ (Action Selector)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 leading-normal">
              {users.map((user) => {
                const isMe = currentUser?.id === user.id;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20"
                      />
                      <div>
                        <p className="font-bold text-slate-850 dark:text-slate-100">
                          {user.fullName}
                          {isMe && (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                              <ShieldCheck className="w-2.5 h-2.5 inline text-indigo-500" />
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ID บัญชี: #{user.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-700 dark:text-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                      >
                        <option value="requester">Employee (ผู้ใช้งาน)</option>
                        <option value="technician">Technician (ไอที)</option>
                        <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
