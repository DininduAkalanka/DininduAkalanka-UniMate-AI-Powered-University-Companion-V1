/**
 * Smart Notification Service
 * AI-powered notification triggers based on predictions
 * Phase 1: Deadline Risk & Workload Alerts
 */

import { TaskStatus } from '../types';
import { NotificationPriority, NotificationType } from '../types/notification';
import { notificationManager } from './notificationManager';
import { analyzeWorkload, predictDeadlineRisks } from './predictionService';
import { getTasks } from './taskServiceFirestore';

/**
 * PHASE 1: CORE FEATURES
 */

/**
 * Check and send deadline risk notifications
 */
export async function checkDeadlineRisks(userId: string): Promise<void> {
  try {
    console.log('\n🔍 [DEADLINE RISK CHECK] Starting check...');
    console.log('⏰ Time:', new Date().toLocaleString());
    
    // Get all incomplete tasks
    const allTasks = await getTasks(userId);
    const incompleteTasks = allTasks.filter(t => t.status !== TaskStatus.COMPLETED);
    
    console.log('📋 Total tasks:', allTasks.length);
    console.log('📌 Incomplete tasks:', incompleteTasks.length);
    
    if (incompleteTasks.length === 0) {
      console.log('✓ [Smart Notifications] No incomplete tasks found - no checks needed\n');
      return;
    }

    // Get predictions for all tasks
    const predictions = await predictDeadlineRisks(incompleteTasks);
    
    console.log('🤖 AI Predictions generated for', predictions.length, 'tasks');
    console.log('━'.repeat(50));
    
    // Process each prediction
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    
    for (const prediction of predictions) {
      const task = incompleteTasks.find(t => t.id === prediction.taskId);
      if (!task) continue;

      console.log(`\n📊 Task: "${task.title}"`);
      console.log(`   Risk: ${prediction.riskLevel.toUpperCase()} | Days: ${prediction.daysRemaining} | Hours/day: ${prediction.recommendedHoursPerDay.toFixed(1)}`);

      // CRITICAL: High-risk task with <2 days remaining
      if (prediction.riskLevel === 'high' && prediction.daysRemaining <= 2) {
        criticalCount++;
        console.log('   🚨 CRITICAL - Sending urgent notification!');
        await notificationManager.sendSmart({
          userId,
          type: NotificationType.DEADLINE_ALERT,
          priority: NotificationPriority.CRITICAL,
          title: `🚨 URGENT: ${task.title}`,
          body: prediction.daysRemaining === 0
            ? `Due TODAY! Need ${prediction.recommendedHoursPerDay.toFixed(1)} more hours.`
            : `Due in ${prediction.daysRemaining} day${prediction.daysRemaining > 1 ? 's' : ''}! Need ${prediction.recommendedHoursPerDay.toFixed(1)}h/day.`,
          emoji: '🚨',
          color: '#EF4444',
          sound: 'urgent',
          vibration: [0, 500, 200, 500, 200, 500],
          action: 'OPEN_TASK',
          actionData: {
            taskId: task.id,
            screen: 'TaskDetail',
            params: { taskId: task.id }
          },
          data: {
            prediction: prediction,
            taskTitle: task.title,
            dueDate: task.dueDate.toISOString(),
          },
          category: 'deadline_critical'
        });
      }
      
      // HIGH: High-risk task with 3-5 days remaining
      else if (prediction.riskLevel === 'high' && prediction.daysRemaining <= 5) {
        highCount++;
        console.log('   ⚠️ HIGH PRIORITY - Sending alert notification!');
        await notificationManager.sendSmart({
          userId,
          type: NotificationType.DEADLINE_ALERT,
          priority: NotificationPriority.HIGH,
          title: `⚠️ High Priority: ${task.title}`,
          body: `Due in ${prediction.daysRemaining} days. Plan ${Math.ceil(prediction.recommendedHoursPerDay)}h daily to stay on track.`,
          emoji: '⚠️',
          color: '#F59E0B',
          badge: '⚠️',
          sound: 'default',
          vibration: [0, 300, 200, 300],
          action: 'OPEN_TASK',
          actionData: {
            taskId: task.id,
            screen: 'TaskDetail',
          },
          data: {
            prediction: prediction,
            recommendation: `Break into smaller chunks and dedicate ${Math.ceil(prediction.recommendedHoursPerDay)}h daily.`
          },
          category: 'deadline_high'
        });
      }
      
      // MEDIUM: Medium-risk task approaching deadline
      else if (prediction.riskLevel === 'medium' && prediction.daysRemaining <= 5) {
        mediumCount++;
        console.log('   📝 MEDIUM PRIORITY - Sending reminder notification!');
        await notificationManager.sendSmart({
          userId,
          type: NotificationType.DEADLINE_ALERT,
          priority: NotificationPriority.MEDIUM,
          title: `📚 Reminder: ${task.title}`,
          body: `Due in ${prediction.daysRemaining} days. ${Math.ceil(prediction.recommendedHoursPerDay)}h/day recommended.`,
          emoji: '📚',
          color: '#3B82F6',
          sound: 'subtle',
          vibration: [0, 200],
          action: 'OPEN_TASK',
          actionData: {
            taskId: task.id,
          },
          data: {
            prediction: prediction,
          },
          category: 'deadline_medium'
        });
      }
      
      // LOW: Weekly reminder for tasks 7 days away
      else if (prediction.riskLevel === 'low' && prediction.daysRemaining === 7) {
        console.log('   ✅ LOW PRIORITY - Sending weekly reminder!');
        await notificationManager.sendSmart({
          userId,
          type: NotificationType.DEADLINE_ALERT,
          priority: NotificationPriority.LOW,
          title: `📅 Upcoming: ${task.title}`,
          body: `Due in 1 week. You're on track! Keep up ${Math.ceil(prediction.recommendedHoursPerDay)}h/day.`,
          emoji: '✅',
          color: '#10B981',
          action: 'OPEN_TASK',
          actionData: {
            taskId: task.id,
          },
          data: {
            prediction: prediction,
          },
          category: 'deadline_low'
        });
      } else {
        console.log('   ✓ No notification needed (low risk or not within alert window)');
      }
    }

    console.log('\n━'.repeat(50));
    console.log('📊 [DEADLINE RISK CHECK SUMMARY]');
    console.log('   🚨 Critical:', criticalCount);
    console.log('   ⚠️ High:', highCount);
    console.log('   📝 Medium:', mediumCount);
    console.log('   Total checked:', predictions.length);
    console.log('✅ [DEADLINE RISK CHECK] Complete\n');
  } catch (error) {
    console.error('[Smart Notifications] Error checking deadline risks:', error);
  }
}

/**
 * Check and send workload overload alerts
 */
export async function checkWorkloadAlerts(userId: string): Promise<void> {
  try {
    console.log('\n📊 [WORKLOAD CHECK] Starting workload analysis...');
    console.log('⏰ Time:', new Date().toLocaleString());
    
    const tasks = await getTasks(userId);
    const workload = await analyzeWorkload(tasks, userId);
    
    console.log('📈 Workload Analysis:');
    console.log('   Level:', workload.level.toUpperCase());
    console.log('   Hours/week:', workload.hoursPerWeek.toFixed(1));
    console.log('   Active tasks:', workload.activeTasks);
    
    // CRITICAL: Severely overloaded (>12h/day)
    if (workload.averageHoursPerDay > 12) {
      console.log('   🚨 CRITICAL OVERLOAD - Sending urgent workload alert!');
      await notificationManager.sendSmart({
        userId,
        type: NotificationType.OVERLOAD_WARNING,
        priority: NotificationPriority.CRITICAL,
        title: '🚨 Critical Workload Alert!',
        body: `You need ${workload.averageHoursPerDay.toFixed(1)}h/day - this is unsustainable! Immediate action required.`,
        emoji: '🚨',
        color: '#EF4444',
        sound: 'urgent',
        vibration: [0, 500, 200, 500],
        action: 'VIEW_RECOMMENDATIONS',
        actionData: {
          screen: 'Planner',
        },
        data: {
          workload: workload,
          recommendations: [
            'Request deadline extensions immediately',
            'Prioritize only critical tasks',
            'Seek help from professors/tutors',
            'Consider dropping non-essential commitments',
          ]
        },
        category: 'workload_critical'
      });
    }
    
    // HIGH: Overloaded (10-12h/day)
    else if (workload.isOverloaded) {
      console.log('   ⚠️ OVERLOADED - Sending workload warning!');
      await notificationManager.sendSmart({
        userId,
        type: NotificationType.OVERLOAD_WARNING,
        priority: NotificationPriority.HIGH,
        title: '⚠️ You\'re Overloaded!',
        body: `${workload.totalHoursNeeded.toFixed(1)}h of work needs ${workload.averageHoursPerDay.toFixed(1)}h/day. Consider prioritizing or requesting extensions.`,
        emoji: '⚠️',
        color: '#F59E0B',
        badge: '⚠️',
        sound: 'default',
        vibration: [0, 300, 200, 300],
        action: 'OPEN_PLANNER',
        actionData: {
          screen: 'Planner',
        },
        data: {
          workload: workload,
          recommendation: workload.recommendation
        },
        category: 'workload_high'
      });
    }
    
    // MEDIUM: Heavy workload (8-10h/day)
    else if (workload.averageHoursPerDay > 8) {
      console.log('   📚 HEAVY WORKLOAD - Sending planning notification!');
      await notificationManager.sendSmart({
        userId,
        type: NotificationType.OVERLOAD_WARNING,
        priority: NotificationPriority.MEDIUM,
        title: '📚 Heavy Workload Ahead',
        body: `You need ${workload.averageHoursPerDay.toFixed(1)}h/day across ${tasks.filter(t => t.status !== TaskStatus.COMPLETED).length} tasks. Plan your week carefully.`,
        emoji: '📚',
        color: '#3B82F6',
        sound: 'subtle',
        action: 'OPEN_PLANNER',
        actionData: {
          screen: 'Planner',
        },
        data: {
          workload: workload,
          tips: [
            'Use time-blocking for better organization',
            'Start with most challenging tasks',
            'Schedule regular breaks',
            'Track progress daily',
          ]
        },
        category: 'workload_medium'
      });
    }
    
    // LOW: Light workload confirmation (<4h/day)
    else if (workload.averageHoursPerDay < 4 && tasks.filter(t => t.status !== TaskStatus.COMPLETED).length > 0) {
      console.log('   ✅ LIGHT WORKLOAD - Sending encouragement notification!');
      await notificationManager.sendSmart({
        userId,
        type: NotificationType.PRODUCTIVITY_TIP,
        priority: NotificationPriority.LOW,
        title: '✅ You\'re In Control!',
        body: `Light workload: ${workload.averageHoursPerDay.toFixed(1)}h/day. Great job staying organized!`,
        emoji: '✅',
        color: '#10B981',
        action: 'OPEN_PLANNER',
        data: {
          workload: workload,
          suggestion: 'Use extra time for deep learning or help peers.',
        },
        category: 'workload_light'
      });
    } else {
      console.log('   ✓ Balanced workload - No notification needed');
    }

    console.log('\n✅ [WORKLOAD CHECK] Complete');
    console.log('   Average hours/day:', workload.averageHoursPerDay.toFixed(1));
    console.log('   Level:', workload.level.toUpperCase(), '\n');
  } catch (error) {
    console.error('[Smart Notifications] Error checking workload:', error);
  }
}

/**
 * Daily morning briefing with predictions
 */
export async function sendMorningBriefing(userId: string): Promise<void> {
  try {
    console.log('[Smart Notifications] Sending morning briefing...');
    
    const tasks = await getTasks(userId);
    const incompleteTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    
    if (incompleteTasks.length === 0) {
      await notificationManager.sendSmart({
        userId,
        type: NotificationType.PRODUCTIVITY_TIP,
        priority: NotificationPriority.LOW,
        title: '☀️ Good Morning!',
        body: 'No pending tasks today. Great job staying on top of your work! 🎉',
        emoji: '☀️',
        color: '#10B981',
        action: 'NONE',
        category: 'briefing'
      });
      return;
    }

    const predictions = await predictDeadlineRisks(incompleteTasks);
    const workload = await analyzeWorkload(tasks, userId);
    
    // Count tasks by risk level
    const highRisk = predictions.filter(p => p.riskLevel === 'high').length;
    const mediumRisk = predictions.filter(p => p.riskLevel === 'medium').length;
    
    // Tasks due today
    const dueToday = predictions.filter(p => p.daysRemaining === 0).length;
    
    let briefingText = `☀️ Good Morning!\n\n`;
    
    if (dueToday > 0) {
      briefingText += `📌 ${dueToday} task${dueToday > 1 ? 's' : ''} due TODAY!\n`;
    }
    
    if (highRisk > 0) {
      briefingText += `🚨 ${highRisk} high-risk task${highRisk > 1 ? 's' : ''}\n`;
    }
    
    if (mediumRisk > 0) {
      briefingText += `⚠️ ${mediumRisk} medium-risk task${mediumRisk > 1 ? 's' : ''}\n`;
    }
    
    briefingText += `\n📊 Today's workload: ${workload.averageHoursPerDay.toFixed(1)}h recommended`;
    
    const priority = dueToday > 0 || highRisk > 0 
      ? NotificationPriority.HIGH 
      : NotificationPriority.MEDIUM;

    await notificationManager.sendSmart({
      userId,
      type: NotificationType.STUDY_REMINDER,
      priority: priority,
      title: '☀️ Daily Briefing',
      body: briefingText,
      emoji: '☀️',
      color: priority === NotificationPriority.HIGH ? '#F59E0B' : '#3B82F6',
      action: 'OPEN_TASKS',
      actionData: {
        screen: 'Tasks',
      },
      data: {
        highRisk,
        mediumRisk,
        dueToday,
        workload: workload.averageHoursPerDay,
      },
      category: 'briefing'
    });

    console.log('[Smart Notifications] Morning briefing sent');
  } catch (error) {
    console.error('[Smart Notifications] Error sending morning briefing:', error);
  }
}

/**
 * Run all Phase 1 checks
 */
export async function runPhase1Checks(userId: string): Promise<void> {
  console.log('[Smart Notifications] Running Phase 1 checks...');
  
  await Promise.all([
    checkDeadlineRisks(userId),
    checkWorkloadAlerts(userId),
  ]);
  
  console.log('[Smart Notifications] Phase 1 checks complete');
}

/**
 * Initialize notification system for user
 */
export async function initializeNotifications(userId: string): Promise<boolean> {
  try {
    console.log('[Smart Notifications] Initializing for user:', userId);
    
    // Initialize notification manager
    const initialized = await notificationManager.initialize();
    
    if (!initialized) {
      console.warn('[Smart Notifications] Initialization failed');
      return false;
    }

    // DON'T run Phase 1 checks on initialization
    // They will run later when the dashboard loads and auth is ready
    console.log('[Smart Notifications] Initialization complete (checks deferred until auth ready)');
    
    return true;
    
    console.log('[Smart Notifications] Initialization complete');
    return true;
  } catch (error) {
    console.error('[Smart Notifications] Initialization error:', error);
    return false;
  }
}

/**
 * Test notification (for debugging)
 */
export async function sendTestNotification(userId: string): Promise<void> {
  console.log('🧪 [TEST NOTIFICATION] ====================================');
  console.log('[TEST] User ID:', userId);
  console.log('[TEST] Attempting to send test notification...');
  
  try {
    const result = await notificationManager.sendSmart({
      userId,
      type: NotificationType.PRODUCTIVITY_TIP,
      priority: NotificationPriority.MEDIUM,
      title: '🧪 Test Notification',
      body: 'Smart notifications are working! Your AI assistant is ready to help.',
      emoji: '🧪',
      color: '#3B82F6',
      action: 'OPEN_TASKS',
      category: 'test'
    });
    
    console.log('[TEST] ✅ Test notification sent successfully!');
    console.log('[TEST] Notification ID:', result);
    console.log('[TEST] Check your notification tray now! 📱');
    console.log('🧪 [TEST NOTIFICATION END] ================================');
  } catch (error) {
    console.error('[TEST] ❌ Failed to send test notification:', error);
    console.log('🧪 [TEST NOTIFICATION END] ================================');
    throw error;
  }
}

export default {
  checkDeadlineRisks,
  checkWorkloadAlerts,
  sendMorningBriefing,
  runPhase1Checks,
  initializeNotifications,
  sendTestNotification,
};
