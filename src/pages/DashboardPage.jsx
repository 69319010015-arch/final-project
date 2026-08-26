import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const DashboardPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  // Reactive DB queries
  const stats = useLiveQuery(async () => {
    const all = await db.tickets.toArray();
    
    // Filter based on role: Requester sees only their own tickets, Tech/Admin see all
    const userTickets = currentUser.role === 'requester'
      ? all.filter(t => t.requesterId === currentUser.id)
      : all;

    const open = userTickets.filter(t => t.status === 'open').length;
    const inProgress = userTickets.filter(t => t.status === 'in_progress').length;
    const resolved = userTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    
    // Category mapping
    const categories = { Hardware: 0, Software: 0, Network: 0, 'Account & Security': 0 };
    userTickets.forEach(t => {
      if (categories[t.category] !== undefined) {
        categories[t.category]++;
      }
    });

    const categoryData = Object.keys(categories).map(key => ({
      name: key,
      จำนวน: categories[key]
    }));

    // Priority mapping
    const priorities = { low: 0, medium: 0, high: 0, critical: 0 };
    userTickets.forEach(t => {
      const p = t.priority?.toLowerCase() || 'low';
      if (priorities[p] !== undefined) {
        priorities[p]++;
      }
    });

    const priorityData = [
      { name: 'Low', value: priorities.low, color: '#94a3b8' },
      { name: 'Medium', value: priorities.medium, color: '#3b82f6' },
      { name: 'High', value: priorities.high, color: '#f59e0b' },
      { name: 'Critical', value: priorities.critical, color: '#ef4444' }
    ].filter(item => item.value > 0); // Hide empty priorities in pie chart

    // Get 4 most recent tickets
    const recent = [...userTickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    // Map requesters' names to recent tickets
    const recentWithRequester = [];
    for (const ticket of recent) {
      const reqUser = await db.users.get(ticket.requesterId);
      recentWithRequester.push({
        ...ticket,
        requesterName: reqUser ? reqUser.fullName.split(' ')[0] : 'Unknown'
      });
    }

    return {
      total: userTickets.length,
      open,
      inProgress,
      resolved,
      categoryData,
      priorityData,
      recent: recentWithRequester
    };
  }, [currentUser?.id, currentUser?.role]);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Generate dynamic greeting message
  const getGreeting = () => {
    const hours = new Date().getHours();
    let timeGreeting = 'สวัสดี';
    if (hours < 12) timeGreeting = 'สวัสดีตอนเช้า';
    else if (hours < 17) timeGreeting = 'สวัสดีตอนบ่าย';
    else timeGreeting = 'สวัสดีตอนเย็น';

    if (currentUser.role === 'admin') {
      return `${timeGreeting}ครับ ท่านผู้ดูแลระบบ มีคำขอใหม่รอดำเนินการอยู่หรือไม่?`;
    } else if (currentUser.role === 'technician') {
      return `${timeGreeting}ครับคุณ ${currentUser.fullName.split(' ')[0]} วันนี้มีปัญหาไอทีรอให้คุณช่วยเหลืออยู่นะครับ`;
    } else {
      return `${timeGreeting}คุณ ${currentUser.fullName.split(' ')[0]} ยินดีต้อนรับสู่ระบบแจ้งซ่อมไอที มีอะไรให้เราช่วยวันนี้ไหมครับ?`;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40';
      case 'high':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      case 'in_progress':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'รอดำเนินการ';
      case 'in_progress': return 'กำลังแก้ไข';
      case 'resolved': return 'แก้ไขแล้ว';
      case 'closed': return 'ปิดตั๋วแล้ว';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-brand-700 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl"></div>
        <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl"></div>
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <TrendingUp className="w-3.5 h-3.5" />
            Live Dashboard
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-display">
            {getGreeting()}
          </h2>
          <p className="text-xs md:text-sm text-indigo-100 max-w-xl font-medium">
            ใช้แดชบอร์ดนี้เพื่อดูสถิติตำแหน่งงานซ่อม, ตรวจสอบลำดับความสำคัญ และควบคุมตั๋วปัญหาไอทีในองค์กรของคุณแบบเรียลไทม์
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        
        {/* Total Tickets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">ตั๋วทั้งหมด</p>
            <p className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-1">{stats.total}</p>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-red-100/80 p-3 dark:bg-red-950/30 text-red-600 dark:text-red-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">รอดำเนินการ</p>
            <p className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-1">{stats.open}</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-blue-100/80 p-3 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">กำลังดำเนินการ</p>
            <p className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-1">{stats.inProgress}</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-emerald-100/80 p-3 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">แก้ไขเสร็จสิ้น</p>
            <p className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-1">{stats.resolved}</p>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Category Chart (Bar Chart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-6">
            สัดส่วนปัญหาจำแนกตามหมวดหมู่ (Category distribution)
          </h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="จำนวน" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Chart (Pie Chart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-6">
            ระดับความรุนแรงของปัญหา (Priority level)
          </h3>
          <div className="h-64 flex-1 flex flex-col justify-center items-center">
            {stats.priorityData.length === 0 ? (
              <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลตั๋วค้างในขณะนี้</p>
            ) : (
              <>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                  {stats.priorityData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Recent Tickets Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              ตั๋วปัญหาอัปเดตล่าสุด
            </h3>
            <p className="text-xs text-slate-400">รายการแจ้งปัญหาไอทีที่เพิ่งส่งเข้ามาหรือได้รับการเปลี่ยนสถานะล่าสุด</p>
          </div>
          <button
            onClick={() => onNavigate('tickets')}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ดูทั้งหมด
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Ticket Cards/Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stats.recent.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              ยังไม่มีประวัติการส่งตั๋วแจ้งซ่อมในระบบ
            </div>
          ) : (
            stats.recent.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onNavigate('ticket_detail', ticket.id)}
                className="group flex flex-col md:flex-row md:items-center justify-between py-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-all"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{ticket.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {ticket.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-1">
                    ผู้แจ้ง: {ticket.requesterName} · วันที่: {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0 justify-between shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
