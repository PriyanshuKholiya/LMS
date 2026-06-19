import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  toast: { id: string; title: string; body: string } | null;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeToast: () => void;
  triggerLocalNotification: (title: string, body: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultMockNotifications = (userId: string): NotificationItem[] => [
  {
    id: 'notif-mock-1',
    user_id: userId,
    title: 'New Quiz Published',
    body: "Quiz 2: Neural Networks Backpropagation has been posted in Intro to Deep Learning.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
  },
  {
    id: 'notif-mock-2',
    user_id: userId,
    title: 'New Assignment Published',
    body: "Assignment 1: Database Normalization is now active. Check syllabus for instructions.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
  },
  {
    id: 'notif-mock-3',
    user_id: userId,
    title: 'Course Syllabus Updated',
    body: "Prof. Marcus Vance added a video lecture resource to Relational Algebra.",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [toast, setToast] = useState<{ id: string; title: string; body: string } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize and load historical notifications from local storage / REST API
  const loadHistory = async () => {
    if (!user) return;
    
    // In local dev, check if there is cached state
    const storageKey = `aegis_mock_notifications_${user.id}`;
    let cached = localStorage.getItem(storageKey);
    
    if (!cached) {
      const defaults = defaultMockNotifications(user.id);
      localStorage.setItem(storageKey, JSON.stringify(defaults));
      cached = JSON.stringify(defaults);
    }
    
    // Attempt REST fetch if backend is active
    try {
      const response = await fetch(`http://localhost:8000/api/v1/notifications/?unread_only=false`, {
        headers: {
          'Authorization': `Bearer mock-token` // Placeholder
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
        localStorage.setItem(storageKey, JSON.stringify(data));
        return;
      }
    } catch (err) {
      // Backend not running/unreachable, fallback to local storage
      console.log("Backend notification endpoints offline. Falling back to local storage cache.");
    }
    
    const parsed: NotificationItem[] = JSON.parse(cached);
    setNotifications(parsed);
    setUnreadCount(parsed.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    loadHistory();
    
    if (user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  const connectWebSocket = () => {
    if (!user) return;
    
    disconnectWebSocket();
    setWsStatus('connecting');
    
    // Open WebSocket to local backend
    const wsUrl = `ws://localhost:8000/api/v1/notifications/ws/${user.id}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const newNotif: NotificationItem = JSON.parse(event.data);
        handleIncomingNotification(newNotif);
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      // Schedule reconnect loop
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.onclose = null; // Prevent triggers
      socketRef.current.onerror = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    setWsStatus('disconnected');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connectWebSocket();
    }, 10000); // Attempt reconnection every 10 seconds
  };

  const handleIncomingNotification = (newNotif: NotificationItem) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== newNotif.id);
      const updated = [newNotif, ...filtered];
      
      if (user) {
        localStorage.setItem(`aegis_mock_notifications_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    if (!newNotif.is_read) {
      setUnreadCount(prev => prev + 1);
      // Trigger instant screen toast banner
      setToast({
        id: newNotif.id,
        title: newNotif.title,
        body: newNotif.body
      });
    }
  };

  const triggerLocalNotification = (title: string, body: string) => {
    // Helper to simulate incoming ws notification locally (useful for role sandbox testing)
    if (!user) return;
    const item: NotificationItem = {
      id: `notif-local-${Math.random().toString(36).substring(2, 9)}`,
      user_id: user.id,
      title,
      body,
      is_read: false,
      created_at: new Date().toISOString()
    };
    handleIncomingNotification(item);
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    // Call REST endpoint
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer mock-token`
        }
      });
    } catch (err) {
      // Offline fallback
    }

    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      localStorage.setItem(`aegis_mock_notifications_${user.id}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!user) return;

    // Call REST endpoint
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer mock-token`
        }
      });
    } catch (err) {
      // Offline fallback
    }

    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, is_read: true }));
      localStorage.setItem(`aegis_mock_notifications_${user.id}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const removeToast = () => {
    setToast(null);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      wsStatus,
      toast,
      markAsRead,
      markAllRead,
      removeToast,
      triggerLocalNotification
    }}>
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
