import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
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

const iconMap = {
  success: faCircleCheck,
  error: faCircleXmark,
  warning: faTriangleExclamation,
  info: faCircleInfo,
} as const;

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove,
}) => {
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!notification.timeout) {
        return;
      }

      if (timersRef.current[notification.id]) {
        return;
      }

      timersRef.current[notification.id] = window.setTimeout(() => {
        onRemove(notification.id);
        delete timersRef.current[notification.id];
      }, notification.timeout);
    });

    Object.entries(timersRef.current).forEach(([id, timer]) => {
      if (!notifications.some((notification) => notification.id === id)) {
        clearTimeout(timer);
        delete timersRef.current[id];
      }
    });
  }, [notifications, onRemove]);

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach((timer) => {
        clearTimeout(timer);
      });
      timersRef.current = {};
    },
    [],
  );

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification--${notification.type}`}
        >
          <span className="notification-icon" aria-hidden="true">
            <FontAwesomeIcon icon={iconMap[notification.type]} />
          </span>
          <span className="notification-message">{notification.message}</span>
          <button
            type="button"
            className="notification-close"
            aria-label="Dismiss notification"
            onClick={() => onRemove(notification.id)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
    info,
  };
};
