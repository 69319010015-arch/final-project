import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, seedDatabase } from '../db/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize DB and Auth Session
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Seed database if first time
        await seedDatabase();

        // 2. Restore login session if exists
        const savedUserId = localStorage.getItem('helpdesk_user_id');
        if (savedUserId) {
          const user = await db.users.get(Number(savedUserId));
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('helpdesk_user_id');
          }
        }
      } catch (err) {
        console.error('Error initializing database/auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Login handler
  const login = async (username, password) => {
    const user = await db.users
      .where('username')
      .equals(username.toLowerCase())
      .first();

    if (!user) {
      throw new Error('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ');
    }

    if (user.password !== password) {
      throw new Error('รหัสผ่านไม่ถูกต้อง');
    }

    setCurrentUser(user);
    localStorage.setItem('helpdesk_user_id', String(user.id));
    return user;
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('helpdesk_user_id');
  };

  // Switch user in Demo mode
  const quickSwitchUser = async (userIdOrRole) => {
    let user;
    if (typeof userIdOrRole === 'number') {
      user = await db.users.get(userIdOrRole);
    } else {
      // Find first user with that role
      user = await db.users.where('role').equals(userIdOrRole).first();
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('helpdesk_user_id', String(user.id));
      return user;
    }
    return null;
  };

  // Update user profile info (e.g. changing name or role)
  const updateUserProfile = async (updatedUser) => {
    await db.users.put(updatedUser);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        quickSwitchUser,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
