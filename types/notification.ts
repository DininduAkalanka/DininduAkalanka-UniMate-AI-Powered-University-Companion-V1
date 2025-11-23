/**
 * Notification System Types
 * Smart AI-powered notification interfaces
 */

export enum NotificationPriority {
  CRITICAL = 'critical',    // Send immediately, bypass quiet hours
  HIGH = 'high',           // Send within 1 hour
  MEDIUM = 'medium',       // Send at next scheduled check
  LOW = 'low'              // Can be batched, no urgency
}

export enum NotificationType {
  DEADLINE_ALERT = 'deadline_alert',
  OVERLOAD_WARNING = 'overload_warning',
  PRODUCTIVITY_TIP = 'productivity_tip',
  ACHIEVEMENT = 'achievement',
  BURNOUT_WARNING = 'burnout_warning',
  PEAK_TIME_REMINDER = 'peak_time_reminder',
  STUDY_REMINDER = 'study_reminder',
  BREAK_REMINDER = 'break_reminder',
  WEEKLY_SUMMARY = 'weekly_summary'
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  timestamp: Date;
  scheduledFor?: Date;
  
  // Visual properties
  emoji?: string;
  color?: string;
  badge?: string;
  
  // Sound and haptics
  sound?: 'default' | 'urgent' | 'subtle' | 'gentle' | null;
  vibration?: number[] | null;
  
  // Action properties
  action?: 'OPEN_TASK' | 'OPEN_PLANNER' | 'OPEN_TASKS' | 'VIEW_ANALYTICS' | 'VIEW_STATS' | 'VIEW_RECOMMENDATIONS' | 'NONE';
  actionData?: {
    taskId?: string;
    courseId?: string;
    screen?: string;
    params?: Record<string, any>;
  };
  
  // Metadata
  data?: Record<string, any>;
  category?: string;
  read?: boolean;
  dismissed?: boolean;
}

export interface NotificationSettings {
  userId: string;
  enabled: boolean;
  
  // Type-specific settings
  deadlineAlerts: boolean;
  overloadWarnings: boolean;
  productivityTips: boolean;
  achievements: boolean;
  burnoutWarnings: boolean;
  peakTimeReminders: boolean;
  studyReminders: boolean;
  breakReminders: boolean;
  weeklySummary: boolean;
  
  // Timing preferences
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  
  // Frequency preferences
  maxNotificationsPerDay: number;
  minTimeBetweenNotifications: number; // minutes
  
  // Sound preferences
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationAnalytics {
  notificationId: string;
  type: NotificationType;
  priority: NotificationPriority;
  sentAt: Date;
  opened: boolean;
  openedAt?: Date;
  actionTaken: boolean;
  actionType?: string;
  responseTimeSeconds?: number;
  dismissed: boolean;
  dismissedAt?: Date;
}

export interface NotificationSchedule {
  id: string;
  type: NotificationType;
  recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'custom';
  time?: string; // "09:00"
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  lastSent?: Date;
  nextScheduled?: Date;
}

export interface RateLimitInfo {
  key: string;
  lastSent: number;
  dailyCount: number;
  dailyDate: string;
}

export interface NotificationBatch {
  id: string;
  notifications: NotificationPayload[];
  scheduledFor: Date;
  sent: boolean;
}
