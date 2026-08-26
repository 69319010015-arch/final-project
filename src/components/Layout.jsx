import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { SimulatorPanel } from './SimulatorPanel';
import { useNotifications } from '../context/NotificationContext';
import { MessageSquare, AlertCircle } from 'lucide-react';

export const Layout = ({ children, currentPage, onNavigate, onNavigateToTicket }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast, setToast } = useNotifications();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <Navbar
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNavigate={onNavigateToTicket}
        />

        {/* Dynamic Page Content Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* In-app Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 flex max-w-md w-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 dark:bg-slate-900/90 backdrop-blur-md">
            <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-600">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-indigo-400">แจ้งเตือนใหม่</p>
              <p className="text-xs text-slate-200 mt-1 leading-normal font-medium">
                {toast.message}
              </p>
              {toast.ticketId && onNavigateToTicket && (
                <button
                  onClick={() => {
                    onNavigateToTicket('ticket_detail', toast.ticketId);
                    setToast(null);
                  }}
                  className="mt-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline block"
                >
                  เปิดตั๋วปัญหาดูรายละเอียด
                </button>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 focus:outline-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Developer Demo Simulator Panel */}
      <SimulatorPanel />
    </div>
  );
};
