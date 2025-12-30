import axios from "axios";
import { AppNotification, NotificationListResponse, NotificationStats } from "../../types/notification";

const API = axios.create({
    baseURL: "https://tms-be-kst3.onrender.com/api/v1/tms/notifications",
});

/**
 * Attach token
 */
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ========== API Calls ==========

/**
 * Get all notifications
 */
export const getNotificationsApi = (params?: {
    page?: number;
    limit?: number;
    is_read?: boolean;
    type?: string;
    sort_by?: string;
    sort_order?: "ASC" | "DESC";
}) => API.get<{ data: NotificationListResponse }>("/", { params });

/**
 * Get unread count
 */
export const getUnreadCountApi = () =>
    API.get<{ data: { count: number } }>("/unread-count");

/**
 * Get recent notifications
 */
export const getRecentNotificationsApi = (days: number = 7) =>
    API.get<{ data: AppNotification[] }>("/recent", { params: { days } });

/**
 * Get notification stats
 */
export const getNotificationStatsApi = () =>
    API.get<{ data: NotificationStats }>("/stats");

/**
 * Get notification by ID
 */
export const getNotificationByIdApi = (id: string) =>
    API.get<{ data: AppNotification }>(`/${id}`);

/**
 * Mark notification as read
 */
export const markNotificationAsReadApi = (id: string) =>
    API.patch<{ data: AppNotification }>(`/${id}/read`);

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadApi = () =>
    API.patch<{ data: { message: string; count: number } }>("/mark-all-read");

/**
 * Delete notification
 */
export const deleteNotificationApi = (id: string) =>
    API.delete<{ data: { message: string } }>(`/${id}`);

/**
 * Delete all notifications
 */
export const deleteAllNotificationsApi = () =>
    API.delete<{ data: { message: string; count: number } }>("/"); // Note: Route is just slash based on controller, usually it might be /all but checking route definition it is "/"

/**
 * Get VAPID Public Key
 */
export const getVapidPublicKeyApi = () =>
    API.get<{ data: { publicKey: string } }>("/push/public-key");

/**
 * Subscribe to push notifications
 */
export const subscribeToPushApi = (subscription: PushSubscription) =>
    API.post<{ data: any }>("/push/subscribe", { subscription });

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushApi = (endpoint: string) =>
    API.post<{ data: any }>("/push/unsubscribe", { endpoint });
