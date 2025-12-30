// context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppNotification, NotificationStats } from "../types/notification";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
  getNotificationStatsApi,
} from "../components/service/notificationService";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  subscribeToPush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching recent notifications by default or paginated - updating to fetch first page
      // Using a reasonable limit for the dropdown/list
      const response = await getNotificationsApi({ limit: 20, sort_by: "createdAt", sort_order: "DESC" });
      if (response.data && response.data.data) {
        // The API response structure wraps the actual list in `data` property of the `data` object based on service definition
        // But axios response.data is the body. The service `getNotificationsApi` returns `API.get<{ data: NotificationListResponse }>`
        // So axios data contains `{ data: NotificationListResponse }` ??
        // Let's check the service definition again.
        // The service uses `API.get` which returns AxiosResponse.
        // The generic type passed to get is the response body type.
        // Most backend frameworks wrap success in `data` or similar.
        // Looking at backend controller: `res.sendSuccess(notifications, ...)`
        // If `sendSuccess` wraps in `{ success: true, data: ... }` then we need to be careful.
        // Assuming standard response wrapper based on previous interactions, let's look at `UserManagement` or `Task` service if available?
        // I will assume `response.data.data.data` or similar if wrapper exists.
        // Let's rely on the service typings I just wrote:
        // `API.get<{ data: NotificationListResponse }>` means `response.data` is the object, and `response.data.data` is the `NotificationListResponse`.
        // `NotificationListResponse` has `data: AppNotification[]`.
        // So it is `response.data.data.data`.

        // Let's blindly trust the return type I defined in service for now:
        // response.data is the body.
        // body.data is NotificationListResponse.
        // NotificationListResponse.data is AppNotification[].

        setNotifications(response.data.data.data);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err: any) {
      console.error("Failed to fetch notifications", err);
      // Don't set error state globally to avoid breaking UI for non-critical notification failures
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCountApi();
      if (response.data && response.data.data) {
        setUnreadCount(response.data.data.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await getNotificationStatsApi();
      if (response.data && response.data.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await markNotificationAsReadApi(id);
      // Re-fetch to ensure sync
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark as read", err);
      // Revert if needed, but for read status it's usually fine
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await markAllNotificationsAsReadApi();
    } catch (err) {
      console.error("Failed to mark all as read", err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotificationApi(id);
      fetchUnreadCount(); // Count might change if we deleted an unread one
    } catch (err) {
      console.error("Failed to delete notification", err);
      fetchNotifications();
    }
  };

  const refresh = async () => {
    await Promise.all([fetchNotifications(), fetchStats()]);
  };

  // Helper to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      console.log("[PushContext] Initializing push subscription...");

      if (!('serviceWorker' in navigator)) {
        console.warn('[PushContext] ❌ Service Worker not supported in this browser');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.warn('[PushContext] ❌ Service Worker registration not found');
        return;
      }

      console.log("[PushContext] Service Worker is ready");

      if (!registration.pushManager) {
        console.warn('[PushContext] ❌ Push Manager not available on Service Worker registration. Check if you are using HTTPS or localhost.');
        return;
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("[PushContext] Existing subscription found:", existingSubscription.endpoint);
        // Still send to backend to ensure sync
        await import("../components/service/notificationService").then(m => m.subscribeToPushApi(existingSubscription as any));
        return;
      }

      console.log("[PushContext] Requesting VAPID public key...");
      const response = await import("../components/service/notificationService").then(m => m.getVapidPublicKeyApi());

      if (!response.data || !response.data.data || !response.data.data.publicKey) {
        throw new Error("Failed to get VAPID key from backend");
      }

      const publicKey = response.data.data.publicKey;
      console.log("[PushContext] VAPID key received:", publicKey);
      const convertedKey = urlBase64ToUint8Array(publicKey);

      console.log("[PushContext] Calling pushManager.subscribe...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      console.log("[PushContext] Subscription successful:", subscription.endpoint);

      // 3. Send to backend
      await import("../components/service/notificationService").then(m => m.subscribeToPushApi(subscription as any));

      console.log("[PushContext] ✅ Backend successfully notified of new subscription");
    } catch (err) {
      console.error("[PushContext] ❌ Error in push subscription flow:", err);
    }
  };

  // Initial load
  useEffect(() => {
    refresh();
    const interval = setInterval(fetchUnreadCount, 60000);

    // Auto-subscribe if permission is already granted but no subscription exists
    if ("Notification" in window && Notification.permission === "granted") {
      subscribeToPush().catch(err => console.error("Auto-subscribe failed", err));
    }

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount, fetchStats]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      stats,
      loading,
      error,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh,
      subscribeToPush
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be inside provider");
  return ctx;
};
