import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  PlusCircle,
  HelpCircle,
  FileSpreadsheet,
  FileCode,
  ArrowUpDown
} from 'lucide-react';

export const TicketsPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest, asc = oldest

  // Fetch tickets and map requester names in live query
  const ticketsData = useLiveQuery(async () => {
    const all = await db.tickets.toArray();
    
    // Role filter: Requesters see only their own tickets
    const userTickets = currentUser.role === 'requester'
      ? all.filter(t => t.requesterId === currentUser.id)
      : all;

    // Apply Filters
    let filtered = userTickets.filter((ticket) => {
      const matchSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory =
        categoryFilter === 'all' || ticket.category === categoryFilter;
      
      const matchPriority =
        priorityFilter === 'all' || ticket.priority?.toLowerCase() === priorityFilter.toLowerCase();
      
      const matchStatus =
        statusFilter === 'all' || ticket.status === statusFilter;

      return matchSearch && matchCategory && matchPriority && matchStatus;
    });

    // Sort by Date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Fetch requester and technician information for each ticket
    const detailedTickets = [];
    for (const t of filtered) {
      const requester = await db.users.get(t.requesterId);
      const assignee = t.assigneeId ? await db.users.get(t.assigneeId) : null;
      detailedTickets.push({
        ...t,
        requesterName: requester ? requester.fullName : 'Unknown',
        assigneeName: assignee ? assignee.fullName : 'Unassigned'
      });
    }

    return detailedTickets;
  }, [currentUser?.id, currentUser?.role, searchTerm, categoryFilter, priorityFilter, statusFilter, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Export functions (CSV with UTF-8 BOM for Thai Excel compatibility)
  const exportToCSV = () => {
    if (!ticketsData || ticketsData.length === 0) return;
    
    const headers = ['ID', 'หัวข้อ', 'รายละเอียด', 'หมวดหมู่', 'ความสำคัญ', 'สถานะ', 'ผู้แจ้ง', 'ผู้รับผิดชอบ', 'วันที่สร้าง'];
    const rows = ticketsData.map(t => [
      t.id,
      t.title.replace(/"/g, '""'),
      t.description.replace(/"/g, '""'),
      t.category,
      t.priority,
      t.status,
      t.requesterName,
      t.assigneeName,
      new Date(t.createdAt).toLocaleString('th-TH')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Excel Thai language compatibility (UTF-8 with BOM)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HelpDesk-Tickets-Export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!ticketsData || ticketsData.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(ticketsData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `HelpDesk-Tickets-Export-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/30';
      case 'high':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/30';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/30';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border-slate-200 dark:border-slate-700';
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight font-display text-slate-800 dark:text-slate-100">
            รายการตั๋วแจ้งปัญหา IT
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ค้นหา กรอง และติดตามสถานะตั๋วแจ้งปัญหารวมในระบบซัพพอร์ตทั้งหมด
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('create_ticket')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            แจ้งปัญหาใหม่
          </button>
          
          {/* Export Dropdown buttons */}
          {ticketsData && ticketsData.length > 0 && (
            <div className="flex gap-1.5">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                title="ส่งออกรายงาน Excel CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                CSV
              </button>
              <button
                onClick={exportToJSON}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                title="ส่งออกไฟล์ JSON"
              >
                <FileCode className="w-4 h-4 text-indigo-500" />
                JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหาตามหัวข้อ หรือเนื้อหาปัญหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs dark:border-slate-850 dark:bg-slate-800/40 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Filters grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:flex sm:items-center">
            
            {/* Category Filter */}
            <div className="flex flex-col">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="all">ทุกหมวดหมู่</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Account & Security">Security</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="all">ทุกความสำคัญ</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="open">รอดำเนินการ</option>
                <option value="in_progress">กำลังแก้ไข</option>
                <option value="resolved">แก้ไขแล้ว</option>
                <option value="closed">ปิดตั๋วแล้ว</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={toggleSort}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
              title="เรียงตามเวลา"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              {sortOrder === 'desc' ? 'ตั๋วใหม่สุด' : 'ตั๋วเก่าสุด'}
            </button>
          </div>

        </div>
      </div>

      {/* Tickets List Area */}
      {!ticketsData ? (
        <div className="flex h-44 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : ticketsData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center text-slate-400">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold">ไม่พบรายการตั๋วปัญหาไอทีตามเงื่อนไขที่เลือก</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา/การกรอง หรือสลับจำลองส่งตั๋วใหม่ดูครับ</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (lg screens) */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-450">
              <thead className="bg-slate-50 dark:bg-slate-950 font-semibold text-slate-750 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">ตั๋วปัญหา / ผู้แจ้ง</th>
                  <th scope="col" className="px-6 py-4">หมวดหมู่</th>
                  <th scope="col" className="px-6 py-4">ความสำคัญ</th>
                  <th scope="col" className="px-6 py-4">วันที่แจ้ง</th>
                  <th scope="col" className="px-6 py-4">ผู้รับผิดชอบ</th>
                  <th scope="col" className="px-6 py-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 leading-normal">
                {ticketsData.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onNavigate('ticket_detail', ticket.id)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 max-w-sm">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{ticket.description}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-350 font-semibold text-xs">{ticket.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                      {ticket.assigneeName.split(' ')[0]}
                    </td>
                    <td className="px-6 py-4 text-center shrink-0">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (sm/md screens) */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {ticketsData.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onNavigate('ticket_detail', ticket.id)}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/40 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                  {ticket.title}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>
                
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>แจ้งโดย: {ticket.requesterName.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};
