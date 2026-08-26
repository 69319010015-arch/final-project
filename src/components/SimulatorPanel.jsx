import React, { useState, useEffect } from 'react';
import { Play, Square, UserCheck, HelpCircle, Send, MessageSquare, BellRing, Settings } from 'lucide-react';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  simulateNewTicket,
  simulateReply,
  startSimulation,
  stopSimulation,
  isSimulationRunning
} from '../db/simulator';

export const SimulatorPanel = () => {
  const { quickSwitchUser, currentUser } = useAuth();
  const { addLocalNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoSimActive, setIsAutoSimActive] = useState(false);
  const [users, setUsers] = useState([]);
  const [simLog, setSimLog] = useState([]);

  // Fetch users for the switcher on open
  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await db.users.toArray();
      setUsers(allUsers);
    };
    fetchUsers();
  }, []);

  // Update simulator status
  useEffect(() => {
    setIsAutoSimActive(isSimulationRunning());
  }, []);

  const addLog = (msg) => {
    setSimLog((prev) => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), message: msg },
      ...prev.slice(0, 15) // Keep last 15 logs
    ]);
  };

  const handleToggleAutoSim = () => {
    if (isAutoSimActive) {
      stopSimulation();
      setIsAutoSimActive(false);
      addLog('❌ หยุดการจำลองกิจกรรมอัตโนมัติ');
    } else {
      startSimulation(({ actionType, ticketId }) => {
        const typeThai = actionType === 'new_ticket' ? 'สร้างตั๋วใหม่' : 'ตอบแชทตั๋ว';
        addLog(`🤖 [Auto] จำลองกิจกรรม: ${typeThai} (ID: ${ticketId}) สำเร็จ`);
      });
      setIsAutoSimActive(true);
      addLog('🚀 เริ่มการจำลองกิจกรรมอัตโนมัติ (ทุก 15 วินาที)');
    }
  };

  const handleSimulateTicket = async () => {
    try {
      const ticketId = await simulateNewTicket();
      if (ticketId) {
        const ticket = await db.tickets.get(ticketId);
        addLog(`🎫 [Manual] จำลองสร้างตั๋วสำเร็จ: ID ${ticketId} - "${ticket.title}"`);
      }
    } catch (err) {
      addLog(`⚠️ เกิดข้อผิดพลาดในการจำลองสร้างตั๋ว: ${err.message}`);
    }
  };

  const handleSimulateReply = async () => {
    try {
      const ticketId = await simulateReply();
      if (ticketId) {
        const ticket = await db.tickets.get(ticketId);
        addLog(`💬 [Manual] จำลองข้อความตอบกลับบนตั๋ว ID ${ticketId} - "${ticket.title}"`);
      } else {
        addLog('⚠️ ไม่มีตั๋วสถานะ Open / In Progress ในระบบให้ตอบกลับ');
      }
    } catch (err) {
      addLog(`⚠️ เกิดข้อผิดพลาดในการจำลองตอบแชท: ${err.message}`);
    }
  };

  const handleQuickSwitch = async (userId, name) => {
    await quickSwitchUser(userId);
    addLog(`👤 สลับผู้ใช้เข้าสู่ระบบเป็น: ${name}`);
    // Show user feedback toast or reload page
    window.location.reload(); // Force reload to re-initialize layout with correct user context
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center animate-bounce focus:outline-none"
        title="แผงจำลองกิจกรรมผู้ใช้งาน (Demo Simulator)"
      >
        <Settings className="w-6 h-6 animate-spin-slow" />
        {isAutoSimActive && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </button>

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-80 md:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Demo Simulator
            </h3>
            <p className="text-xs text-slate-500">แผงจำลองผู้ใช้งานและกิจกรรม IT Support</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section 1: User Account Switcher */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              สลับผู้ใช้งาน (Quick Switch)
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleQuickSwitch(u.id, u.fullName)}
                    className={`flex items-center gap-3 p-2 rounded-xl border text-left text-sm transition-all ${
                      isCurrent
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <img src={u.avatar} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                    </div>
                    {isCurrent && <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">Active</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Simulator Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              จำลองการทำงาน (Actions)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSimulateTicket}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center gap-2 group transition-colors"
              >
                <HelpCircle className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">จำลองสร้างตั๋ว</span>
              </button>
              <button
                onClick={handleSimulateReply}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center gap-2 group transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">จำลองการตอบแชท</span>
              </button>
            </div>
          </div>

          {/* Section 3: Automatic Simulator */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <BellRing className="w-4 h-4" />
              การอัปเดตอัตโนมัติ (Live Simulation)
            </h4>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">ลูปจำลองทำงานอัตโนมัติ</p>
                <p className="text-[10px] text-slate-400">สร้างตั๋ว/ตอบแชท ทุกๆ 15 วินาที</p>
              </div>
              <button
                onClick={handleToggleAutoSim}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
                  isAutoSimActive
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                }`}
              >
                {isAutoSimActive ? (
                  <>
                    <Square className="w-4 h-4" />
                    หยุด
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    เริ่ม
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 4: Activity Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              ประวัติกิจกรรมจำลอง (Logs)
            </h4>
            <div className="bg-slate-950 text-slate-300 text-[10px] font-mono p-3 rounded-xl min-h-36 max-h-48 overflow-y-auto space-y-1.5 border border-slate-800">
              {simLog.length === 0 ? (
                <p className="text-slate-500 italic text-center pt-8">ยังไม่มีกิจกรรมบันทึกไว้...</p>
              ) : (
                simLog.map((log) => (
                  <div key={log.id} className="leading-tight">
                    <span className="text-indigo-400">[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 font-medium">
          ระบบขับเคลื่อนโดย IndexedDB & React v19
        </div>
      </div>
    </>
  );
};
