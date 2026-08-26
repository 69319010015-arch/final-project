import React, { useState } from 'react';
import { Bell, Check, Trash2, Menu, X, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = ({ onMenuToggle, isSidebarOpen, onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'status_change':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleNotificationClick = async (notif) => {
    await markAsRead(notif.id);
    setIsNotifOpen(false);
    if (notif.ticketId && onNavigate) {
      onNavigate('ticket_detail', notif.ticketId);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      case 'technician':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
    }
  };

  const getRoleBadgeLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'technician':
        return 'IT Support';
      default:
        return 'Employee';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 dark:border-slate-800">
      {/* Mobile Hamburger Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        {/* Workspace Title for smaller screens */}
        <h1 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 tracking-tight lg:hidden">
          IT Support Help Desk
        </h1>
      </div>

      {/* Right Navbar Section */}
      <div className="ml-auto flex items-center gap-4">
        
        {/* Dark Mode Switcher */}
        <ThemeToggle />

        {/* Live Notifications Menu */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              {/* Overlay blocker */}
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
              
              {/* Notifications Dropdown Panel */}
              <div className="absolute right-0 mt-2 z-50 w-80 md:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">การแจ้งเตือน</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold focus:outline-none"
                        title="ทำเครื่องหมายอ่านทั้งหมด"
                      >
                        <Check className="w-3.5 h-3.5" /> อ่านทั้งหมด
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 font-semibold focus:outline-none"
                        title="ล้างทั้งหมด"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ล้าง
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      ไม่มีการแจ้งเตือนในขณะนี้
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors ${
                          n.isRead === 0 ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-medium' : ''
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString()} · {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {n.isRead === 0 && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vertical divider */}
        <span className="h-6 w-px bg-slate-200 dark:bg-slate-800"></span>

        {/* User profile section */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.fullName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[150px] truncate leading-tight">
                {currentUser.fullName.split(' ')[0]}
              </p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${getRoleBadgeColor(currentUser.role)}`}>
                {getRoleBadgeLabel(currentUser.role)}
              </span>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
