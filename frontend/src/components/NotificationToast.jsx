import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const t = useTheme();
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const notify = useMemo(() => ({
    success: (msg) => addNotification(msg, 'success'),
    error: (msg) => addNotification(msg, 'error'),
    info: (msg) => addNotification(msg, 'info'),
    warning: (msg) => addNotification(msg, 'warning'),
    order: (msg) => addNotification(msg, 'order', 6000),
  }), [addNotification]);

  const colors = {
    success: { bg: '#27ae60', icon: '✅' },
    error: { bg: '#e53e3e', icon: '❌' },
    info: { bg: '#3498db', icon: 'ℹ️' },
    warning: { bg: '#e67e22', icon: '⚠️' },
    order: { bg: '#9b59b6', icon: '🛵' },
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {/* Notification Stack */}
      <div style={{
        position: 'fixed', top: '16px', right: '16px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 10001, maxWidth: '320px', pointerEvents: 'none',
      }}>
        {notifications.map((n, i) => {
          const c = colors[n.type] || colors.info;
          return (
            <div key={n.id} style={{
              backgroundColor: c.bg, color: '#fff', padding: '12px 16px',
              borderRadius: '12px', fontSize: '13px', fontWeight: '700',
              boxShadow: `0 8px 24px ${c.bg}66`,
              fontFamily: "'Segoe UI', sans-serif",
              display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'slideInRight 0.3s ease',
              pointerEvents: 'auto',
            }}>
              <span style={{ fontSize: '16px' }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{n.message}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </NotificationContext.Provider>
  );
}
