import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  ArrowLeft,
  User,
  Clock,
  Wrench,
  CheckCircle,
  Send,
  MessageSquare,
  AlertCircle,
  FileImage,
  X
} from 'lucide-react';

export const TicketDetailPage = ({ ticketId, onNavigateBack }) => {
  const { currentUser } = useAuth();
  const { addLocalNotification } = useNotifications();
  const [newMessage, setNewMessage] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const chatEndRef = useRef(null);

  // Live query for ticket details, comments, and users
  const data = useLiveQuery(async () => {
    const ticket = await db.tickets.get(ticketId);
    if (!ticket) return null;

    const requester = await db.users.get(ticket.requesterId);
    const assignee = ticket.assigneeId ? await db.users.get(ticket.assigneeId) : null;
    
    // Comments on this ticket, sorted oldest first for chat timeline
    const rawComments = await db.comments
      .where('ticketId')
      .equals(ticketId)
      .sortBy('createdAt');

    const commentsWithSender = [];
    for (const c of rawComments) {
      const sender = await db.users.get(c.senderId);
      commentsWithSender.push({
        ...c,
        senderName: sender ? sender.fullName : 'System',
        senderAvatar: sender ? sender.avatar : '',
        senderRole: sender ? sender.role : 'system'
      });
    }

    // List of technicians for assignment dropdown
    const technicians = await db.users.where('role').equals('technician').toArray();

    return {
      ticket,
      requester,
      assignee,
      comments: commentsWithSender,
      technicians
    };
  }, [ticketId]);

  // Sync resolution notes state when ticket loads
  useEffect(() => {
    if (data?.ticket?.resolutionNotes) {
      setResNotes(data.ticket.resolutionNotes);
    } else {
      setResNotes('');
    }
  }, [data?.ticket]);

  // Scroll to bottom of chat when new comments arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.comments]);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const { ticket, requester, assignee, comments, technicians } = data;

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const comment = {
        ticketId,
        senderId: currentUser.id,
        message: newMessage,
        createdAt: new Date()
      };

      await db.comments.add(comment);
      setNewMessage('');

      // Update ticket updatedAt
      await db.tickets.update(ticketId, { updatedAt: new Date() });

      // Notify the other party
      if (currentUser.role === 'requester') {
        if (ticket.assigneeId) {
          await addLocalNotification(
            ticket.assigneeId,
            `คุณ ${currentUser.fullName.split(' ')[0]} ตอบแชทในตั๋ว: "${ticket.title}"`,
            'comment',
            ticketId
          );
        }
      } else {
        await addLocalNotification(
          ticket.requesterId,
          `มีข้อความใหม่จาก IT Support ในตั๋ว: "${ticket.title}"`,
          'comment',
          ticketId
        );
      }
    } catch (err) {
      console.error('Failed to send comment:', err);
    }
  };

  const handleAssignToMe = async () => {
    try {
      setIsUpdating(true);
      await db.tickets.update(ticketId, {
        assigneeId: currentUser.id,
        status: 'in_progress',
        updatedAt: new Date()
      });

      // System comment
      await db.comments.add({
        ticketId,
        senderId: currentUser.id,
        message: `🔄 ระบบ: คุณ ${currentUser.fullName.split(' ')[0]} รับมอบหมายงานและเริ่มดำเนินการแก้ไขปัญหา`,
        createdAt: new Date()
      });

      // Notify requester
      await addLocalNotification(
        ticket.requesterId,
        `ตั๋วของคุณ: "${ticket.title}" ได้รับการตอบรับเริ่มดำเนินการโดยคุณ ${currentUser.fullName.split(' ')[0]}`,
        'status_change',
        ticketId
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsUpdating(true);
      const prevStatus = ticket.status;
      
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // If resolving, we save the resolution notes too
      if (newStatus === 'resolved') {
        updateData.resolutionNotes = resNotes;
      }

      await db.tickets.update(ticketId, updateData);

      // System message in chat
      const statusLabels = { open: 'รอดำเนินการ', in_progress: 'กำลังแก้ไข', resolved: 'แก้ไขแล้ว', closed: 'ปิดตั๋วแล้ว' };
      await db.comments.add({
        ticketId,
        senderId: currentUser.id,
        message: `🔄 ระบบ: สถานะตั๋วได้รับการเปลี่ยนจาก "${statusLabels[prevStatus]}" เป็น "${statusLabels[newStatus]}"`,
        createdAt: new Date()
      });

      // Notify the requester
      await addLocalNotification(
        ticket.requesterId,
        `ตั๋วของคุณ: "${ticket.title}" ได้รับการอัปเดตสถานะเป็น "${statusLabels[newStatus]}"`,
        'status_change',
        ticketId
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveResolutionNotes = async () => {
    try {
      setIsUpdating(true);
      await db.tickets.update(ticketId, {
        resolutionNotes: resNotes,
        updatedAt: new Date()
      });
      alert('บันทึกวิธีแก้ไขปัญหาเรียบร้อยแล้ว!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTechnicianSelect = async (e) => {
    const techId = e.target.value ? Number(e.target.value) : null;
    if (!techId) return;

    try {
      setIsUpdating(true);
      const techUser = await db.users.get(techId);
      
      await db.tickets.update(ticketId, {
        assigneeId: techId,
        status: 'in_progress',
        updatedAt: new Date()
      });

      await db.comments.add({
        ticketId,
        senderId: currentUser.id,
        message: `🔄 ระบบ: ได้รับการส่งต่อมอบหมายงานให้กับคุณ ${techUser.fullName.split(' ')[0]}`,
        createdAt: new Date()
      });

      // Notify assignee
      await addLocalNotification(
        techId,
        `คุณได้รับมอบหมายตั๋วใหม่: "${ticket.title}"`,
        'status_change',
        ticketId
      );

      // Notify requester
      await addLocalNotification(
        ticket.requesterId,
        `ตั๋วของคุณได้รับการส่งมอบหมายให้คุณ ${techUser.fullName.split(' ')[0]}`,
        'status_change',
        ticketId
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-300 border-red-200';
      case 'high':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border-slate-200';
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

  const isStaff = currentUser.role === 'technician' || currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top action bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onNavigateBack}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100">
            รายละเอียดตั๋วปัญหารายงาน ID #{ticket.id}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            อัปเดตสถานะ ส่งตั๋วซ่อม หรือพิมพ์แชทคุยแบบเรียลไทม์ได้ในส่วนด้านล่าง
          </p>
        </div>
      </div>

      {/* Main split details content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Ticket details & Action panel */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Detail card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug">
                {ticket.title}
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
                {ticket.description}
              </p>
            </div>

            {/* Thumbnail attachment if exists */}
            {ticket.attachmentUrl && (
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <FileImage className="w-3.5 h-3.5" />
                  ไฟล์ภาพแนบปัญหา
                </p>
                <div
                  className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:opacity-90 group transition-all"
                  onClick={() => setPreviewImage(ticket.attachmentUrl)}
                >
                  <img
                    src={ticket.attachmentUrl}
                    alt="Attachment"
                    className="max-h-40 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    คลิกเพื่อขยายรูป
                  </div>
                </div>
              </div>
            )}

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Meta values */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่</p>
                <p className="font-bold text-slate-700 dark:text-slate-350 mt-1">{ticket.category}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ความสำคัญ</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้แจ้งเรื่อง</p>
                <p className="font-bold text-slate-700 dark:text-slate-350 mt-1 truncate">{requester?.fullName.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะ</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${getStatusColor(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">วันที่แจ้งเรื่อง</p>
                <p className="text-slate-500 mt-1">
                  {new Date(ticket.createdAt).toLocaleString('th-TH')}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้รับงานซ่อม</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {assignee ? assignee.fullName : 'ยังไม่มีผู้รับผิดชอบ'}
                </p>
              </div>
            </div>
          </div>

          {/* IT Support Controls Panel */}
          {isStaff && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-500" />
                เครื่องมือ IT Support
              </h4>

              {/* Assignment choices */}
              <div className="space-y-3">
                {!ticket.assigneeId ? (
                  <button
                    onClick={handleAssignToMe}
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 shadow-md shadow-indigo-600/10 focus:outline-none transition-colors"
                  >
                    รับมอบหมายงานชิ้นนี้
                  </button>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">โอนย้ายงานให้ผู้อื่น</label>
                    <select
                      value={ticket.assigneeId || ''}
                      onChange={handleTechnicianSelect}
                      disabled={isUpdating}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-700 dark:text-slate-350 dark:border-slate-800 focus:outline-none"
                    >
                      <option value="" disabled>-- เลือกช่างไอที --</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>
                          {tech.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status switches */}
                {ticket.assigneeId && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">เปลี่ยนสถานะงาน</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['in_progress', 'resolved', 'closed'].map(s => {
                        const isCurrent = ticket.status === s;
                        const labels = { in_progress: 'กำลังแก้ไข', resolved: 'แก้ไขเสร็จ', closed: 'ปิดงาน' };
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            disabled={isUpdating || isCurrent}
                            className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-colors ${
                              isCurrent
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {labels[s]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Controls Panel (Close or Reopen ticket if requester) */}
          {!isStaff && currentUser.id === ticket.requesterId && (ticket.status === 'resolved' || ticket.status === 'closed') && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                การตอบรับผู้แจ้งเรื่อง
              </h4>
              
              {ticket.status === 'resolved' && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={isUpdating}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/10 transition-colors"
                  >
                    ยืนยันปิดงานซ่อม (งานสำเร็จเรียบร้อย)
                  </button>
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={isUpdating}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 text-xs font-bold transition-colors"
                  >
                    ปัญหายังมีอยู่ (ต้องการให้ตรวจสอบต่อ)
                  </button>
                </div>
              )}

              {ticket.status === 'closed' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isUpdating}
                  className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400 text-xs font-bold transition-colors"
                >
                  แจ้งเปิดตั๋วปัญหาใหม่อีกครั้ง
                </button>
              )}
            </div>
          )}

          {/* Resolution Notes Panel */}
          {(isStaff || ticket.resolutionNotes) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450">
                วิธีแก้ไขปัญหา (Resolution Notes)
              </h4>
              {isStaff ? (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="ป้อนรายละเอียดวิธีการแก้ปัญหานี้ เพื่อใช้เก็บเป็นคลังข้อมูลและให้ผู้แจ้งทราบ..."
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    disabled={isUpdating || ticket.status === 'closed'}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all text-slate-800 dark:text-slate-100"
                  />
                  {ticket.status !== 'closed' && (
                    <button
                      onClick={handleSaveResolutionNotes}
                      disabled={isUpdating}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors"
                    >
                      บันทึกคำแนะนำการแก้ไข
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 whitespace-pre-line font-medium leading-relaxed">
                  {ticket.resolutionNotes}
                </p>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Chat log Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              ห้องสนทนาและประวัติกิจกรรมตั๋ว (Timeline Chat)
            </h3>
          </div>

          {/* Chat Log Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
            {comments.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-450 italic">
                เริ่มต้นห้องแชท! พิมพ์ข้อความซักถามหรือบันทึกเรื่องราวได้ที่ช่องป้อนข้อความด้านล่าง
              </div>
            ) : (
              comments.map((comment) => {
                const isSystem = comment.senderRole === 'system';
                const isMe = comment.senderId === currentUser.id;

                if (isSystem) {
                  return (
                    <div key={comment.id} className="flex justify-center">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-bold border border-slate-200/50 dark:border-slate-700/50">
                        {comment.message}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={comment.id}
                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in fade-in duration-200`}
                  >
                    <img
                      src={comment.senderAvatar}
                      alt={comment.senderName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-250 dark:ring-slate-800"
                    />
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-slate-400">
                        <span>{comment.senderName.split(' ')[0]}</span>
                        <span className="text-[8px] opacity-75 font-normal">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/40 dark:border-slate-700/40'
                      }`}>
                        <p className="whitespace-pre-wrap">{comment.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Chat Input Panel */}
          {ticket.status !== 'closed' ? (
            <form
              onSubmit={handleSendComment}
              className="p-3 border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="ป้อนคำถาม รายละเอียด หรือข้อซักถามทีมซัพพอร์ต..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 py-2.5 px-4 text-xs focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all text-slate-850 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/10 focus:outline-none transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center text-xs text-slate-450 italic font-semibold">
              🔐 ตั๋วปัญหานี้ได้รับการปิดงานอย่างสมบูรณ์แบบแล้ว (Closed) ห้องสนทนาถูกล็อก
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Image Preview Overlay Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

    </div>
  );
};
