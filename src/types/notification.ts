// types/notification.ts

/**
 * Notification types matching backend ENUM
 */
export type NotificationType =
  | "TASK_CREATED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_UPDATED"
  | "TASK_UPDATED"
  | "TASK_DELETED";

/**
 * Notification metadata structure
 */
export interface NotificationMetadata {
  old_status?: string;
  new_status?: string;
  task_title?: string;
  project_name?: string;
  assigned_by?: string;
  [key: string]: any;
}

/**
 * Main notification interface matching backend model
 */
export interface AppNotification {
  id: string;
  user_id: string;
  user_email: string;
  type: NotificationType;
  title: string;
  message: string;
  task_id?: string;
  project_id?: string;
  metadata?: NotificationMetadata;
  is_read: boolean;
  read_at?: string;
  is_sent: boolean;
  sent_at?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification list response with pagination
 */
export interface NotificationListResponse {
  total: number;
  currentPage: number;
  totalPages: number;
  unreadCount: number;
  data: AppNotification[];
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    [key in NotificationType]?: number;
  };
}

/**
 * Push notification subscription
 */
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
