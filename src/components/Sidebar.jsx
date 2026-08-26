import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BookOpen,
  Users,
  LogOut,
  X,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();

  const handleNavClick = (page) => {
    onNavigate(page);
    if (onClose) onClose(); // Close on mobile after click
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ดสรุป',
      icon: LayoutDashboard,
      roles: ['requester', 'technician', 'admin']
    },
    {
      id: 'tickets',
      label: 'รายการตั๋วปัญหา',
      icon: Ticket,
      roles: ['requester', 'technician', 'admin']
    },
    {
      id: 'create_ticket',
      label: 'แจ้งปัญหา IT',
      icon: PlusCircle,
      roles: ['requester', 'technician', 'admin'] // Requesters mostly, but support can file too
    },
    {
      id: 'kb',
      label: 'คลังความรู้ FAQ',
      icon: BookOpen,
      roles: ['requester', 'technician', 'admin']
    },
    {
      id: 'user_settings',
      label: 'จัดการผู้ใช้งาน',
      icon: Users,
      roles: ['admin'] // Admin only
    }
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser?.role)
  );

  return (
    <>
      {/* Sidebar backdrop for mobile view */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 dark:border-slate-800 transition-transform duration-300 transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logo section */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-600 p-1.5 text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="font-display text-base font-extrabold tracking-tight text-white bg-clip-text">
              IT Support Portal
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'tickets' && currentPage === 'ticket_detail');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User profile Summary & Logout footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {currentUser && (
            <div className="flex items-center gap-3 p-2 mb-3 bg-slate-850/40 rounded-xl">
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate leading-none">
                  {currentUser.fullName.split(' ')[0]}
                </p>
                <span className="text-[10px] text-slate-400 truncate block mt-1 capitalize">
                  {currentUser.role} Account
                </span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-sm font-bold text-red-400 hover:text-red-300 transition-all focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
};
