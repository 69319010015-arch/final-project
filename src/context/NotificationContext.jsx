import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [toast, setToast] = useState(null);
  
  // Keep track of the notification IDs we have already processed during this session
  // to avoid showing old notifications as toast on initial load.
  const processedIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // Reactive query of notifications for current user, sorted by date desc
  const notifications = useLiveQuery(
    async () => {
      if (!currentUser) return [];
      
      const list = await db.notifications
        .where('userId')
        .equals(currentUser.id)
        .reverse()
        .sortBy('createdAt');
        
      return list;
    },
    [currentUser?.id]
  );

  // Trigger toast for new incoming notifications
  useEffect(() => {
    if (!notifications || !currentUser) return;

    // On initial load, we don't toast the existing notifications
    if (initialLoadRef.current) {
      notifications.forEach(n => processedIdsRef.current.add(n.id));
      initialLoadRef.current = false;
      return;
    }

    // Find any new notifications that we haven't seen in this session yet
    const newNotifications = notifications.filter(
      n => !processedIdsRef.current.has(n.id)
    );

    if (newNotifications.length > 0) {
      // Find the latest one
      const latest = newNotifications[0];
      
      // Only toast unread notifications
      if (latest.isRead === 0) {
        setToast({
          id: latest.id,
          message: latest.message,
          ticketId: latest.ticketId
        });
        
        // Auto-dismiss toast after 4 seconds
        const timer = setTimeout(() => {
          setToast(null);
        }, 4000);
        
        // Add all new notifications to processed list so we don't toast them again
        newNotifications.forEach(n => processedIdsRef.current.add(n.id));
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, currentUser]);

  // Reset references when user logs out/in
  useEffect(() => {
    processedIdsRef.current = new Set();
    initialLoadRef.current = true;
    setToast(null);
  }, [currentUser?.id]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    await db.notifications.update(id, { isRead: 1 });
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;
    const unread = await db.notifications
      .where('userId')
      .equals(currentUser.id)
      .and(n => n.isRead === 0)
      .toArray();
      
    for (const n of unread) {
      await db.notifications.update(n.id, { isRead: 1 });
    }
  };

  // Delete/Clear all notifications for user
  const clearAllNotifications = async () => {
    if (!currentUser) return;
    const userNotifs = await db.notifications
      .where('userId')
      .equals(currentUser.id)
      .toArray();
      
    for (const n of userNotifs) {
      await db.notifications.delete(n.id);
    }
  };

  // Helper to trigger a manual simulation event notification
  const addLocalNotification = async (userId, message, type, ticketId = null) => {
    const id = await db.notifications.add({
      userId,
      message,
      type,
      isRead: 0,
      ticketId,
      createdAt: new Date()
    });
    return id;
  };

  const unreadCount = notifications
    ? notifications.filter(n => n.isRead === 0).length
    : 0;

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications || [],
        unreadCount,
        toast,
        setToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        addLocalNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
