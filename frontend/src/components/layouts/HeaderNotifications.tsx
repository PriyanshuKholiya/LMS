import React, { useState, useEffect, useRef } from 'react';
import { useNotifications, type NotificationItem } from '../../context/NotificationContext';
import { 
  Bell, 
  CheckCheck, 
  Circle, 
  X, 
  Wifi, 
  WifiOff, 
  Calendar,
  Volume2
} from 'lucide-react';

export const HeaderNotifications: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    wsStatus, 
    toast, 
    markAsRead, 
    markAllRead, 
    removeToast 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-dismiss toast banner after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        removeToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotifClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (err) {
      return '';
    }
  };

  const getWsStatusColor = () => {
    switch (wsStatus) {
      case 'connected': return '#10b981'; // Green
      case 'connecting': return '#f59e0b'; // Orange
      case 'disconnected': return '#ef4444'; // Red
    }
  };

  return (
    <div style={styles.wrapper} ref={dropdownRef}>
      {/* 1. Live Toast Popup Notification Banner */}
      {toast && (
        <div style={styles.toastContainer} className="glass-panel transition-all">
          <div style={styles.toastHeader}>
            <div style={styles.toastTitleWrapper}>
              <Volume2 size={16} color="var(--primary)" />
              <span style={styles.toastTitle}>{toast.title}</span>
            </div>
            <button onClick={removeToast} style={styles.toastCloseBtn}>
              <X size={14} />
            </button>
          </div>
          <p style={styles.toastBody}>{toast.body}</p>
        </div>
      )}

      {/* 2. Header Bell Button */}
      <button 
        onClick={toggleDropdown} 
        style={styles.bellBtn} 
        className="transition-all"
        title={`Live Connection Status: ${wsStatus}`}
      >
        <Bell size={20} color={isOpen ? 'var(--primary)' : 'var(--text-muted)'} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}

        {/* WebSocket live status dot indicator */}
        <span 
          style={{ 
            ...styles.statusDot, 
            backgroundColor: getWsStatusColor() 
          }} 
        />
      </button>

      {/* 3. Dropdown Menu Panel */}
      {isOpen && (
        <div style={styles.dropdown} className="glass-panel">
          <div style={styles.dropdownHeader}>
            <div style={styles.titleRow}>
              <h3 style={styles.titleText}>Notifications</h3>
              <div style={styles.connectionLabel}>
                {wsStatus === 'connected' ? (
                  <Wifi size={12} color="#10b981" />
                ) : (
                  <WifiOff size={12} color="#ef4444" />
                )}
                <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                  {wsStatus}
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button onClick={markAllRead} style={styles.markAllReadBtn}>
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div style={styles.listContainer}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <Bell size={32} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Inbox is clear</span>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    ...styles.item,
                    borderLeft: notif.is_read ? '3px solid transparent' : '3px solid var(--primary)',
                    backgroundColor: notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.03)'
                  }}
                  className="transition-all"
                >
                  <div style={styles.itemHeader}>
                    <span style={{ 
                      ...styles.itemTitle, 
                      fontWeight: notif.is_read ? 500 : 700,
                      color: notif.is_read ? '#cbd5e1' : '#ffffff'
                    }}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <Circle size={8} fill="var(--primary)" color="var(--primary)" />
                    )}
                  </div>
                  <p style={{
                    ...styles.itemBody,
                    color: notif.is_read ? 'var(--text-muted)' : '#e2e8f0'
                  }}>
                    {notif.body}
                  </p>
                  <div style={styles.itemFooter}>
                    <Calendar size={11} color="var(--text-muted)" />
                    <span>{getRelativeTime(notif.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  bellBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '0.65rem',
    fontWeight: 700,
    borderRadius: '10px',
    padding: '2px 6px',
    minWidth: '16px',
    textAlign: 'center',
    boxShadow: '0 0 0 2px #0f1123'
  },
  statusDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    boxShadow: '0 0 0 2px #0f1123'
  },
  toastContainer: {
    position: 'fixed',
    top: '84px',
    right: '24px',
    width: '320px',
    padding: '16px',
    zIndex: 9999,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
    animation: 'slideIn 0.3s ease-out',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  toastHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  toastTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  toastTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  toastCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex'
  },
  toastBody: {
    fontSize: '0.8rem',
    color: '#cbd5e1',
    lineHeight: 1.4,
    marginLeft: '24px'
  },
  dropdown: {
    position: 'absolute',
    top: '46px',
    right: '-10px',
    width: '340px',
    maxHeight: '460px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--border)'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  titleText: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  connectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  markAllReadBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  listContainer: {
    overflowY: 'auto',
    flex: 1,
    maxHeight: '380px'
  },
  empty: {
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  },
  item: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  },
  itemTitle: {
    fontSize: '0.85rem'
  },
  itemBody: {
    fontSize: '0.8rem',
    lineHeight: 1.4
  },
  itemFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  }
};
