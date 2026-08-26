import React, { useState } from 'react';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { AlertCircle, HelpCircle, FileImage, X, Send, ArrowLeft } from 'lucide-react';

export const CreateTicketPage = ({ onNavigateBack, onNavigateToTickets }) => {
  const { currentUser } = useAuth();
  const { addLocalNotification } = useNotifications();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState('medium');
  const [attachment, setAttachment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Convert uploaded image to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('รองรับเฉพาะไฟล์รูปภาพประกอบปัญหาเท่านั้น (เช่น JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('ขนาดไฟล์รูปภาพห้ามเกิน 2MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAttachment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('กรุณากรอกหัวข้อและรายละเอียดของปัญหาให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newTicket = {
        title,
        description,
        category,
        priority,
        status: 'open',
        requesterId: currentUser.id,
        assigneeId: null,
        attachmentUrl: attachment || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ticketId = await db.tickets.add(newTicket);
      
      // Seed an initial system log message
      await db.comments.add({
        ticketId,
        senderId: currentUser.id,
        message: `🆕 ระบบ: ตั๋วแจ้งปัญหาส่งเข้าระบบสำเร็จโดยพนักงาน (${currentUser.fullName.split(' ')[0]}) รอเจ้าหน้าที่ IT Support รับเรื่อง`,
        createdAt: new Date()
      });

      // Create notifications for all technicians and admins
      const staff = await db.users.where('role').anyOf(['technician', 'admin']).toArray();
      for (const person of staff) {
        await addLocalNotification(
          person.id,
          `ตั๋วแจ้งปัญหาใหม่: "${newTicket.title}" โดยคุณ ${currentUser.fullName.split(' ')[0]}`,
          'new_ticket',
          ticketId
        );
      }

      // Success feedback and navigate to list
      alert('ส่งรายงานตั๋วปัญหาเข้าสู่ระบบไอทีแล้วครับ!');
      onNavigateToTickets();
    } catch (err) {
      setError('ไม่สามารถลงทะเบียนตั๋วปัญหาใน IndexedDB ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onNavigateBack}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100">
            สร้างตั๋วรายงานแจ้งปัญหา IT
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ส่งเรื่องความขัดข้องของฮาร์ดแวร์ ซอฟต์แวร์ หรือเครือข่าย เพื่อให้ทีมสนับสนุนช่วยเหลือ
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              หัวข้อปัญหา (Subject) *
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="กรอกสรุปปัญหาสั้นๆ เช่น คอมค้างบ่อย, พิมพ์เครื่องปริ้นเตอร์ HP แผนกบัญชีไม่ออก"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-800/40 py-3 px-4 text-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Details */}
          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              รายละเอียดความชำรุด/ขัดข้อง (Description) *
            </label>
            <textarea
              id="description"
              required
              rows={5}
              placeholder="กรอกข้อมูลเพิ่มเติม เช่น รหัสตัวเครื่อง, อาการผิดปกติ, วิธีการตรวจสอบเบื้องหลัง หรือตำแหน่งโต๊ะทำงานของคุณ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-800/40 py-3 px-4 text-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all text-slate-850 dark:text-slate-100"
            />
          </div>

          {/* Form grid selectors */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                ประเภทอุปกรณ์/บริการ (Category)
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-sm text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Hardware">Hardware (จอ, เมาส์, คอมพิวเตอร์, ปริ้นเตอร์)</option>
                <option value="Software">Software (Windows, Office, โปรแกรมอื่นๆ)</option>
                <option value="Network">Network (WiFi, Lan, VPN อินเทอร์เน็ต)</option>
                <option value="Account & Security">Security (สิทธิ์ AD, เมลล็อก, ERP ค้าง)</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                ระดับความเร่งด่วน (Priority)
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-sm text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="low">Low (ไม่เร่งด่วน รอคิวได้)</option>
                <option value="medium">Medium (ปานกลาง กระทบงานบางส่วน)</option>
                <option value="high">High (เร่งด่วน กระทบงานหลักของแผนก)</option>
                <option value="critical">Critical (วิกฤต ระบบหลักใช้งานไม่ได้ทั้งบริษัท)</option>
              </select>
            </div>

          </div>

          {/* Image Uploader */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              รูปภาพแนบประกอบปัญหา (Attachment)
            </label>
            
            {!attachment ? (
              <div className="relative border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileImage className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">อัปโหลดภาพอาการเสียหน้าจอ หรือสภาพอุปกรณ์</p>
                <p className="text-[10px] text-slate-450 mt-1">ไฟล์รูปภาพเท่านั้น ขนาดไม่เกิน 2MB</p>
              </div>
            ) : (
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-sm">
                <img src={attachment} alt="Upload preview" className="max-h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-red-650/90 text-white hover:bg-red-700 transition-colors shadow"
                  title="ลบรูปภาพออก"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition-all focus:outline-none disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'กำลังส่งคำขอยื่นตั๋ว...' : 'ยื่นตั๋วแจ้งปัญหา IT'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
