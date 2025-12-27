// context/NotificationContext.tsx
import React, { createContext, useContext, useState } from "react";
import { AppNotification } from "../types/notification";

interface NotificationContextType {
  notifications: AppNotification[];
  pushNotification: (title: string, message: string) => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const pushNotification = (title: string, message: string) => {
    const newNotification: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // In-app
    setNotifications(prev => [newNotification, ...prev]);

    // Browser push
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  return (
    <NotificationContext.Provider value={{ notifications, pushNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be inside provider");
  return ctx;
};
