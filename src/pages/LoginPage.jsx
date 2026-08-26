import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Laptop, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { db } from '../db/db';

export const LoginPage = () => {
  const { login, quickSwitchUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password'); // Default password for ease of test
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);

  // Fetch demo accounts for quick switch dashboard
  useEffect(() => {
    const fetchDemo = async () => {
      const all = await db.users.toArray();
      setDemoUsers(all);
    };
    fetchDemo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้งาน');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userId) => {
    setError('');
    setLoading(true);
    try {
      await quickSwitchUser(userId);
    } catch (err) {
      setError('ไม่สามารถลงชื่อเข้าใช้งานบัญชีจำลองได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 font-sans md:px-6">
      
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"></div>

      <div className="w-full max-w-md space-y-8">
        
        {/* Logo and Greeting */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <Laptop className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight font-display text-white">
            IT Support Help Desk
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            ระบบรับแจ้งเรื่องและบริหารจัดการปัญหาไอทีสำหรับองค์กร
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6 md:p-8 backdrop-blur-md">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="เช่น user1, tech1, admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  รหัสผ่าน (Password)
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="ป้อนรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-700/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        {/* Demo Quick Logins Section */}
        <div className="space-y-4">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              บัญชีทดสอบระบบ (Demo Accounts)
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleDemoLogin(user.id)}
                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800/80 bg-slate-950/20 text-left text-xs transition-all hover:bg-slate-800/40 hover:border-slate-700"
              >
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-slate-200">{user.fullName.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Username: {user.username}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                  user.role === 'admin'
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-800/30'
                    : user.role === 'technician'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/30'
                    : 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/30'
                }`}>
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
