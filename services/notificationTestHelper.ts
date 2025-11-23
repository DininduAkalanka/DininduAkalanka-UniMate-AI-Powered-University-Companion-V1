/**
 * Notification Testing Helper
 * Quick functions to manually test notification system
 */

import { getCurrentUser } from './authService';
import { runPhase1Checks } from './smartNotificationService';
import { getTasks } from './taskServiceFirestore';

/**
 * Manually trigger notification checks
 * Run this from console or button press to test notifications
 */
export async function manualNotificationTest(): Promise<void> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  🧪 MANUAL NOTIFICATION TEST STARTED             ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ No user logged in!');
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('');
    
    // Get tasks
    const tasks = await getTasks(user.id);
    console.log('📋 Found', tasks.length, 'total tasks');
    
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    console.log('📌 Incomplete tasks:', incompleteTasks.length);
    
    if (incompleteTasks.length > 0) {
      console.log('\n📝 Task List:');
      incompleteTasks.forEach((task, i) => {
        const daysUntil = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`   ${i + 1}. ${task.title}`);
        console.log(`      Due: ${task.dueDate.toLocaleDateString()} (${daysUntil} days)`);
        console.log(`      Hours: ${task.estimatedHours || 'Not set'}`);
        console.log(`      Priority: ${task.priority}`);
      });
    } else {
      console.log('\n⚠️ No incomplete tasks found!');
      console.log('   Create some tasks to test notifications.');
    }
    
    console.log('\n🚀 Running Phase 1 checks (Deadline Risks + Workload)...\n');
    
    // Run notification checks
    await runPhase1Checks(user.id);
    
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  ✅ MANUAL NOTIFICATION TEST COMPLETE            ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Check logs above for:');
    console.log('   • Deadline Risk Check logs');
    console.log('   • Workload Check logs');
    console.log('   • Notification Trigger logs (if any sent)');
    console.log('   • Notification Received logs (if any delivered)');
    console.log('');
    console.log('💡 Tips:');
    console.log('   • Look for "CRITICAL", "HIGH", "MEDIUM" risk tasks');
    console.log('   • Check for rate limiting messages');
    console.log('   • Verify notification content matches expectations');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

/**
 * Quick status check - shows notification system state
 */
export async function notificationStatus(): Promise<void> {
  console.log('\n📊 NOTIFICATION SYSTEM STATUS');
  console.log('═'.repeat(50));
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ Not logged in');
      return;
    }
    
    console.log('✅ User:', user.id);
    
    const tasks = await getTasks(user.id);
    const incomplete = tasks.filter(t => t.status !== 'completed');
    
    console.log('📋 Tasks:', tasks.length, 'total,', incomplete.length, 'incomplete');
    
    if (incomplete.length > 0) {
      const dueToday = incomplete.filter(t => {
        const days = Math.ceil((t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days === 0;
      });
      
      const dueThisWeek = incomplete.filter(t => {
        const days = Math.ceil((t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days > 0 && days <= 7;
      });
      
      const overdue = incomplete.filter(t => t.dueDate.getTime() < Date.now());
      
      console.log('⏰ Due today:', dueToday.length);
      console.log('📅 Due this week:', dueThisWeek.length);
      console.log('🚨 Overdue:', overdue.length);
      
      if (overdue.length > 0) {
        console.log('\n🚨 Overdue Tasks:');
        overdue.forEach(t => {
          console.log(`   • ${t.title} (${Math.abs(Math.ceil((t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days ago)`);
        });
      }
      
      if (dueToday.length > 0) {
        console.log('\n⏰ Due Today:');
        dueToday.forEach(t => {
          console.log(`   • ${t.title}`);
        });
      }
    }
    
    console.log('\n💡 Run manualNotificationTest() to trigger notification checks');
    console.log('═'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Create a test task with high risk (for testing)
 * Creates a task due tomorrow with 10 hours of work
 */
export async function createTestHighRiskTask(): Promise<void> {
  console.log('\n🧪 Creating test high-risk task...\n');
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Not logged in');
      return;
    }
    
    const { createTask } = await import('./taskServiceFirestore');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    
    const { TaskType, TaskPriority, TaskStatus } = await import('../types');
    const { getCourses } = await import('./courseServiceFirestore');
    
    // Get first course or use a placeholder ID
    const courses = await getCourses(user.id);
    const courseId = courses.length > 0 ? courses[0].id : 'test-course-id';
    
    if (courses.length === 0) {
      console.log('⚠️ No courses found, using placeholder courseId');
      console.log('   Consider creating a course first for more realistic testing');
    }
    
    await createTask({
      userId: user.id,
      title: `[TEST] High Risk Task - ${new Date().toLocaleTimeString()}`,
      description: 'This is a test task with high estimated hours and close deadline to trigger high-risk notification',
      type: TaskType.ASSIGNMENT,
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      dueDate: tomorrow,
      estimatedHours: 10, // 10 hours for tomorrow = very high risk
      completedHours: 0,
      courseId: courseId,
      reminderDate: undefined,
    });
    
    console.log('✅ Test task created!');
    console.log('📝 Title: [TEST] High Risk Task');
    console.log('⏰ Due: Tomorrow');
    console.log('📊 Estimated Hours: 10 (should trigger HIGH RISK alert)');
    console.log('\nWatch console for:');
    console.log('   1. [Task Integration] notification check trigger');
    console.log('   2. [HIGH RISK TASK DETECTED] alert');
    console.log('   3. Notification trigger and delivery logs\n');
    
  } catch (error) {
    console.error('❌ Failed to create test task:', error);
  }
}

// Make functions available globally for easy testing
if (typeof global !== 'undefined') {
  (global as any).testNotifications = manualNotificationTest;
  (global as any).notificationStatus = notificationStatus;
  (global as any).createTestHighRiskTask = createTestHighRiskTask;
}

export default {
  manualNotificationTest,
  notificationStatus,
  createTestHighRiskTask,
};
