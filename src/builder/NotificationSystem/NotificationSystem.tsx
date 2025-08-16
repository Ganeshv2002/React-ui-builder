import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timeout?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  notifications, 
  onRemove 
}) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.timeout) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.timeout);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification notification--${notification.type}`}
        >
          <span className="notification-icon">
            {getIcon(notification.type)}
          </span>
          <span className="notification-message">
            {notification.message}
          </span>
          <button 
            className="notification-close"
            onClick={() => onRemove(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (message: string, timeout = 3000) => {
    addNotification({ type: 'success', message, timeout });
  };

  const error = (message: string, timeout = 5000) => {
    addNotification({ type: 'error', message, timeout });
  };

  const warning = (message: string, timeout = 4000) => {
    addNotification({ type: 'warning', message, timeout });
  };

  const info = (message: string, timeout = 3000) => {
    addNotification({ type: 'info', message, timeout });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };
};
