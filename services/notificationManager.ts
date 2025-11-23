/**
 * Smart Notification Manager
 * AI-powered notification system with rate limiting and intelligent scheduling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    NotificationAnalytics,
    NotificationPayload,
    NotificationPriority,
    NotificationSettings,
    NotificationType,
    RateLimitInfo
} from '../types/notification';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: '@notification_settings',
  RATE_LIMIT: '@notification_rate_limit',
  ANALYTICS: '@notification_analytics',
  HISTORY: '@notification_history'
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { title, body, data } = notification.request.content;
    const priority = data?.priority as NotificationPriority;
    const type = data?.type as NotificationType;
    
    // === RECEIVED NOTIFICATION LOGGING ===
    const notificationIcons = {
      deadline_alert: '⏰',
      high_risk_task: '🚨',
      productivity_tip: '💡',
      study_reminder: '📚',
      achievement: '🎉',
      reminder: '🔔',
      test: '🧪',
    };
    
    const icon = notificationIcons[type as keyof typeof notificationIcons] || '📨';
    const timestamp = new Date().toLocaleString();
    
    console.log('\n' + '▓'.repeat(50));
    console.log(`${icon} [NOTIFICATION RECEIVED] ${type?.toUpperCase() || 'UNKNOWN'}`);
    console.log('▓'.repeat(50));
    console.log('📱 Device received notification');
    console.log('📝 Title:', title);
    console.log('💬 Body:', body);
    console.log('⏰ Received At:', timestamp);
    console.log('🎯 Priority:', priority);
    console.log('📊 Full Data:', JSON.stringify(data, null, 2));
    console.log('▓'.repeat(50) + '\n');
    // === END RECEIVED NOTIFICATION LOGGING ===
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      priority: priority === NotificationPriority.CRITICAL 
        ? Notifications.AndroidNotificationPriority.MAX 
        : Notifications.AndroidNotificationPriority.HIGH
    };
  },
});

/**
 * Smart Notification Manager Class
 */
class SmartNotificationManager {
  private rateLimitCache: Map<string, RateLimitInfo> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize notification system
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Load rate limit cache
      await this.loadRateLimitCache();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Create Android notification channels
   */
  private async createNotificationChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#EF4444',
      sound: null,
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('high', {
      name: 'Important Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#F59E0B',
      sound: null,
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('medium', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: '#3B82F6',
      sound: null,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('low', {
      name: 'Updates & Tips',
      importance: Notifications.AndroidImportance.LOW,
      showBadge: false,
      enableVibrate: false,
      sound: null,
    });
  }

  /**
   * Send smart notification with rate limiting
   */
  async sendSmart(notification: Omit<NotificationPayload, 'id' | 'timestamp'>): Promise<string | null> {
    try {
      // === COMPREHENSIVE NOTIFICATION LOGGING START ===
      const notificationIcons = {
        deadline_alert: '⏰',
        high_risk_task: '🚨',
        productivity_tip: '💡',
        study_reminder: '📚',
        achievement: '🎉',
        reminder: '🔔',
        test: '🧪',
      };
      
      const icon = notificationIcons[notification.type as keyof typeof notificationIcons] || '📨';
      const timestamp = new Date().toLocaleString();
      
      console.log('\n' + '═'.repeat(50));
      console.log(`${icon} [NOTIFICATION TRIGGER] ${notification.type.toUpperCase()}`);
      console.log('═'.repeat(50));
      console.log('📝 Title:', notification.title);
      console.log('💬 Body:', notification.body);
      console.log('⏰ Time:', timestamp);
      console.log('🎯 Priority:', notification.priority);
      console.log('👤 User ID:', notification.userId);
      console.log('📊 Action Data:', JSON.stringify(notification.actionData, null, 2));
      console.log('🔧 Additional Data:', JSON.stringify(notification.data, null, 2));
      console.log('═'.repeat(50) + '\n');
      // === COMPREHENSIVE NOTIFICATION LOGGING END ===
      
      if (!this.initialized) {
        console.log('[NOTIFICATION MANAGER] Not initialized, initializing now...');
        await this.initialize();
      }

      // Get user settings
      const settings = await this.getSettings(notification.userId);
      console.log('[NOTIFICATION MANAGER] Settings - Enabled:', settings.enabled, 'Type:', notification.type);
      
      if (!settings.enabled) {
        console.log('[NOTIFICATION MANAGER] ⚠️ Notifications disabled by user');
        return null;
      }

      // Check type-specific settings
      if (!this.isTypeEnabled(notification.type, settings)) {
        console.log(`[NOTIFICATION MANAGER] ⚠️ Notification type ${notification.type} disabled`);
        return null;
      }

      // Apply rate limiting
      const canSend = await this.checkRateLimit(notification, settings);
      if (!canSend) {
        console.log('[NOTIFICATION MANAGER] ⚠️ Rate limit exceeded, notification skipped');
        console.log('❌ NOTIFICATION BLOCKED: Rate limit exceeded\n');
        return null;
      }

      // Check quiet hours
      if (await this.isQuietHours(settings) && notification.priority !== NotificationPriority.CRITICAL) {
        console.log('[NOTIFICATION MANAGER] ⏰ Quiet hours active, scheduling for later');
        console.log(`⏸️ NOTIFICATION DELAYED: Quiet hours (will send at ${settings.quietHoursEnd})\n`);
        return await this.scheduleForLater(notification, settings.quietHoursEnd);
      }

      // Send notification
      console.log('[NOTIFICATION MANAGER] 📤 Sending notification now...');
      const notificationId = await this.send(notification, settings);
      console.log('[NOTIFICATION MANAGER] ✅ Notification sent! ID:', notificationId);
      console.log(`✅ NOTIFICATION SENT SUCCESSFULLY (ID: ${notificationId})\n`);

      // Track analytics
      await this.trackSent(notificationId, notification);

      // Update rate limit cache
      await this.updateRateLimit(notification);

      console.log('[NOTIFICATION MANAGER] 📊 Analytics tracked, rate limit updated');
      return notificationId;
    } catch (error) {
      console.error('[NOTIFICATION MANAGER] ❌ Failed to send notification:', error);
      console.error('❌ NOTIFICATION FAILED:', error);
      return null;
    }
  }

  /**
   * Send notification immediately
   */
  private async send(
    notification: Omit<NotificationPayload, 'id' | 'timestamp'>,
    settings: NotificationSettings
  ): Promise<string> {
    const style = this.getNotificationStyle(notification.priority);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.actionData,
          ...notification.data,
          type: notification.type,
          priority: notification.priority,
          action: notification.action,
        },
        color: notification.color || style.color,
        categoryIdentifier: notification.category,
      },
      trigger: null, // Send immediately
    });

    // Trigger haptic feedback if enabled
    if (settings.vibrationEnabled && style.vibration) {
      // You can use expo-haptics here
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return notificationId;
  }

  /**
   * Schedule notification for later
   */
  async scheduleForLater(
    notification: Omit<NotificationPayload, 'id' | 'timestamp'>,
    time: string // "07:00"
  ): Promise<string> {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (scheduledDate < new Date()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const settings = await this.getSettings(notification.userId);
    const style = this.getNotificationStyle(notification.priority);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.actionData,
          ...notification.data,
          type: notification.type,
          priority: notification.priority,
          action: notification.action,
        },
        color: notification.color || style.color,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });

    return notificationId;
  }

  /**
   * Check rate limiting rules
   */
  private async checkRateLimit(
    notification: Omit<NotificationPayload, 'id' | 'timestamp'>,
    settings: NotificationSettings
  ): Promise<boolean> {
    const now = Date.now();
    const today = new Date().toDateString();

    // Critical notifications bypass rate limits
    if (notification.priority === NotificationPriority.CRITICAL) {
      return true;
    }

    // High priority deadline alerts for new tasks bypass global rate limit
    const isNewTaskAlert = notification.data?.isNewTask === true;
    const isImportantAlert = (notification.priority === NotificationPriority.HIGH || notification.priority === NotificationPriority.MEDIUM) 
                            && notification.type === NotificationType.DEADLINE_ALERT;
    
    if (isNewTaskAlert && isImportantAlert) {
      console.log('✓ New high/medium risk task - bypassing global rate limit');
      // Still check per-task and daily limits, but skip minimum time check
    }

    // Check per-task rate limit (same task within 2 hours)
    if (notification.actionData?.taskId) {
      const taskKey = `${notification.type}_${notification.actionData.taskId}`;
      const taskLimit = this.rateLimitCache.get(taskKey);
      
      if (taskLimit && now - taskLimit.lastSent < 2 * 60 * 60 * 1000) {
        console.log('Task notification sent too recently');
        return false;
      }
    }

    // Check daily limit
    const dailyKey = `daily_${notification.userId}`;
    const dailyLimit = this.rateLimitCache.get(dailyKey);
    
    if (dailyLimit) {
      if (dailyLimit.dailyDate !== today) {
        // Reset daily count for new day
        dailyLimit.dailyCount = 0;
        dailyLimit.dailyDate = today;
      }
      
      if (dailyLimit.dailyCount >= settings.maxNotificationsPerDay) {
        console.log('Daily notification limit reached');
        return false;
      }
    }

    // Check minimum time between any notifications (skip for new task alerts)
    if (!isNewTaskAlert || !isImportantAlert) {
      const globalKey = `global_${notification.userId}`;
      const globalLimit = this.rateLimitCache.get(globalKey);
      
      if (globalLimit) {
        const minTimeMs = settings.minTimeBetweenNotifications * 60 * 1000;
        if (now - globalLimit.lastSent < minTimeMs) {
          console.log('Minimum time between notifications not met');
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Update rate limit cache
   */
  private async updateRateLimit(notification: Omit<NotificationPayload, 'id' | 'timestamp'>): Promise<void> {
    const now = Date.now();
    const today = new Date().toDateString();

    // Update task-specific limit
    if (notification.actionData?.taskId) {
      const taskKey = `${notification.type}_${notification.actionData.taskId}`;
      this.rateLimitCache.set(taskKey, {
        key: taskKey,
        lastSent: now,
        dailyCount: 0,
        dailyDate: today,
      });
    }

    // Update daily count
    const dailyKey = `daily_${notification.userId}`;
    const dailyLimit = this.rateLimitCache.get(dailyKey) || {
      key: dailyKey,
      lastSent: 0,
      dailyCount: 0,
      dailyDate: today,
    };
    
    dailyLimit.dailyCount++;
    dailyLimit.lastSent = now;
    this.rateLimitCache.set(dailyKey, dailyLimit);

    // Update global limit
    const globalKey = `global_${notification.userId}`;
    this.rateLimitCache.set(globalKey, {
      key: globalKey,
      lastSent: now,
      dailyCount: 0,
      dailyDate: today,
    });

    // Persist to storage
    await this.saveRateLimitCache();
  }

  /**
   * Check if current time is within quiet hours
   */
  private async isQuietHours(settings: NotificationSettings): Promise<boolean> {
    if (!settings.quietHoursEnabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  /**
   * Check if notification type is enabled
   */
  private isTypeEnabled(type: NotificationType, settings: NotificationSettings): boolean {
    const typeMap: Record<NotificationType, keyof NotificationSettings> = {
      [NotificationType.DEADLINE_ALERT]: 'deadlineAlerts',
      [NotificationType.OVERLOAD_WARNING]: 'overloadWarnings',
      [NotificationType.PRODUCTIVITY_TIP]: 'productivityTips',
      [NotificationType.ACHIEVEMENT]: 'achievements',
      [NotificationType.BURNOUT_WARNING]: 'burnoutWarnings',
      [NotificationType.PEAK_TIME_REMINDER]: 'peakTimeReminders',
      [NotificationType.STUDY_REMINDER]: 'studyReminders',
      [NotificationType.BREAK_REMINDER]: 'breakReminders',
      [NotificationType.WEEKLY_SUMMARY]: 'weeklySummary',
    };

    const settingKey = typeMap[type];
    return settings[settingKey] as boolean;
  }

  /**
   * Get notification visual style based on priority
   */
  private getNotificationStyle(priority: NotificationPriority) {
    const styles = {
      [NotificationPriority.CRITICAL]: {
        color: '#EF4444',
        vibration: [0, 500, 200, 500, 200, 500],
        channelId: 'critical',
      },
      [NotificationPriority.HIGH]: {
        color: '#F59E0B',
        vibration: [0, 300, 200, 300],
        channelId: 'high',
      },
      [NotificationPriority.MEDIUM]: {
        color: '#3B82F6',
        vibration: [0, 200],
        channelId: 'medium',
      },
      [NotificationPriority.LOW]: {
        color: '#10B981',
        vibration: null,
        channelId: 'low',
      },
    };

    return styles[priority];
  }

  /**
   * Get user notification settings
   */
  async getSettings(userId: string): Promise<NotificationSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(`${STORAGE_KEYS.SETTINGS}_${userId}`);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }

      // Return default settings
      return this.getDefaultSettings(userId);
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return this.getDefaultSettings(userId);
    }
  }

  /**
   * Update user notification settings
   */
  async updateSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.SETTINGS}_${settings.userId}`,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(userId: string): NotificationSettings {
    return {
      userId,
      enabled: true,
      deadlineAlerts: true,
      overloadWarnings: true,
      productivityTips: true,
      achievements: true,
      burnoutWarnings: true,
      peakTimeReminders: false, // Opt-in for Phase 2
      studyReminders: true,
      breakReminders: false,
      weeklySummary: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      maxNotificationsPerDay: 10,
      minTimeBetweenNotifications: 30, // 30 minutes
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  /**
   * Track notification sent
   */
  private async trackSent(notificationId: string, notification: Omit<NotificationPayload, 'id' | 'timestamp'>): Promise<void> {
    try {
      const analytics: NotificationAnalytics = {
        notificationId,
        type: notification.type,
        priority: notification.priority,
        sentAt: new Date(),
        opened: false,
        actionTaken: false,
        dismissed: false,
      };

      const key = `${STORAGE_KEYS.ANALYTICS}_${notification.userId}`;
      const existingJson = await AsyncStorage.getItem(key);
      const existing = existingJson ? JSON.parse(existingJson) : [];
      
      existing.push(analytics);
      
      // Keep only last 100 analytics
      if (existing.length > 100) {
        existing.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to track notification:', error);
    }
  }

  /**
   * Mark notification as opened
   */
  async markOpened(notificationId: string, userId: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.ANALYTICS}_${userId}`;
      const analyticsJson = await AsyncStorage.getItem(key);
      
      if (analyticsJson) {
        const analytics: NotificationAnalytics[] = JSON.parse(analyticsJson);
        const notification = analytics.find(n => n.notificationId === notificationId);
        
        if (notification && !notification.opened) {
          notification.opened = true;
          notification.openedAt = new Date();
          notification.responseTimeSeconds = Math.floor(
            (notification.openedAt.getTime() - notification.sentAt.getTime()) / 1000
          );
          
          await AsyncStorage.setItem(key, JSON.stringify(analytics));
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as opened:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Cancel specific notification
   */
  async cancel(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Load rate limit cache from storage
   */
  private async loadRateLimitCache(): Promise<void> {
    try {
      const cacheJson = await AsyncStorage.getItem(STORAGE_KEYS.RATE_LIMIT);
      if (cacheJson) {
        const cacheArray: RateLimitInfo[] = JSON.parse(cacheJson);
        this.rateLimitCache = new Map(cacheArray.map(info => [info.key, info]));
      }
    } catch (error) {
      console.error('Failed to load rate limit cache:', error);
    }
  }

  /**
   * Save rate limit cache to storage
   */
  private async saveRateLimitCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.rateLimitCache.values());
      await AsyncStorage.setItem(STORAGE_KEYS.RATE_LIMIT, JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Failed to save rate limit cache:', error);
    }
  }

  /**
   * Get notification analytics
   */
  async getAnalytics(userId: string): Promise<NotificationAnalytics[]> {
    try {
      const key = `${STORAGE_KEYS.ANALYTICS}_${userId}`;
      const analyticsJson = await AsyncStorage.getItem(key);
      return analyticsJson ? JSON.parse(analyticsJson) : [];
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return [];
    }
  }

  /**
   * Clear all user data
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        `${STORAGE_KEYS.SETTINGS}_${userId}`,
        `${STORAGE_KEYS.ANALYTICS}_${userId}`,
      ]);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }
}

// Export singleton instance
export const notificationManager = new SmartNotificationManager();

// Export class for testing
export default SmartNotificationManager;
