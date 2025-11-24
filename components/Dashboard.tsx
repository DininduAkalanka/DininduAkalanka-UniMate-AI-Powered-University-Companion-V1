import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../constants/config';
import { COLORS_V2, ELEVATION, RADIUS, SPACING, TYPOGRAPHY } from '../constants/designSystem';
import { ILLUSTRATIONS } from '../constants/illustrations';
import { getCourses } from '../services/courseServiceFirestore';
import { predictDeadlineRisks } from '../services/predictionService';
import { getStudyStats } from '../services/studyServiceFirestore';
import { getTasks, getTaskStats } from '../services/taskServiceFirestore';
import { Course, DeadlinePrediction, Task, TaskStatus } from '../types';
import { AnimatedCard } from './ui/AnimatedCard';
import { CourseCard } from './ui/CourseCard';
import { GlassCard } from './ui/GlassCard';
import { Skeleton, SkeletonCard, SkeletonStatCard } from './ui/Skeleton';
import { StatCard } from './ui/StatCard';
import { TaskCard } from './ui/TaskCard';

const { width } = Dimensions.get('window');

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showChatButton, setShowChatButton] = useState(true);
  const scrollYRef = React.useRef(0);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    upcoming: 0,
  });
  const [studyStats, setStudyStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<DeadlinePrediction[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('[Dashboard] Loading tasks...');
      const tasksData = await getTasks(userId);
      console.log('[Dashboard] Tasks loaded:', tasksData.length);
      
      console.log('[Dashboard] Loading courses...');
      const coursesData = await getCourses(userId);
      console.log('[Dashboard] Courses loaded:', coursesData.length);
      
      console.log('[Dashboard] Loading task stats...');
      const statsData = await getTaskStats(userId);
      console.log('[Dashboard] Task stats loaded');
      
      console.log('[Dashboard] Loading study stats...');
      const studyData = await getStudyStats(userId, 7);
      console.log('[Dashboard] Study stats loaded');

      setTasks(tasksData);
      setCourses(coursesData);
      setTaskStats(statsData);
      setStudyStats(studyData);

      // Get deadline predictions for upcoming tasks
      console.log('[Dashboard] Loading predictions...');
      const upcomingTasks = tasksData.filter(
        t => t.status !== TaskStatus.COMPLETED && t.dueDate > new Date()
      );
      const predictionsData = await predictDeadlineRisks(upcomingTasks);
      console.log('[Dashboard] Predictions loaded:', predictionsData.length);
      setPredictions(predictionsData.slice(0, 3)); // Top 3 at-risk tasks

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [userId]);

  // Smart scroll behavior for chat button
  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const delta = currentScrollY - scrollYRef.current;
    
    // Show button when scrolling up or at top, hide when scrolling down
    if (currentScrollY < 50) {
      setShowChatButton(true);
    } else if (delta < -5) {
      // Scrolling up
      setShowChatButton(true);
    } else if (delta > 5) {
      // Scrolling down
      setShowChatButton(false);
    }
    
    scrollYRef.current = currentScrollY;
  }, []);

  const upcomingTasks = useMemo(() => 
    tasks
      .filter(t => t.status !== TaskStatus.COMPLETED)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5),
    [tasks]
  );

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Header Skeleton */}
          <View style={styles.headerWrapper}>
            <Skeleton height={180} borderRadius={0} />
          </View>
          
          {/* Stats Skeleton */}
          <View style={styles.statsContainer}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
          
          {/* Content Skeletons */}
          <View style={styles.section}>
            <Skeleton width={200} height={24} style={{ marginBottom: SPACING.md }} />
            <SkeletonCard />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 100,
        }}
      >
        <View style={styles.headerWrapper}>
          <Image 
            source={ILLUSTRATIONS.heroStudy3}
            style={styles.headerBackgroundImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={[
              'rgba(99, 102, 241, 0.95)',
              'rgba(79, 70, 229, 0.90)',
              'rgba(67, 56, 202, 0.85)'
            ]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 100 }}
              >
                <Text style={styles.greeting}>Welcome back! 👋</Text>
              </MotiView>
              <MotiView
                from={{ translateX: -20, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                transition={{ delay: 200 }}
              >
                <Text style={styles.headerSubtitle}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </MotiView>
            </View>
          </LinearGradient>
        </View>
      </MotiView>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="📋"
          value={taskStats.total}
          label="Total Tasks"
          backgroundImage={ILLUSTRATIONS.taskPending}
          gradientColors={[COLORS_V2.info[400], COLORS_V2.info[600]]}
          delay={0}
        />
        
        <StatCard
          icon="✓"
          value={taskStats.completed}
          label="Completed"
          backgroundImage={ILLUSTRATIONS.taskComplete}
          gradientColors={[COLORS_V2.success[400], COLORS_V2.success[600]]}
          delay={100}
        />
        
        <StatCard
          icon="⚠️"
          value={taskStats.overdue}
          label="Overdue"
          backgroundImage={ILLUSTRATIONS.kanban}
          gradientColors={[COLORS_V2.error[400], COLORS_V2.error[600]]}
          delay={200}
        />
      </View>

      {/* Study Stats */}
      {studyStats && (
        <View style={styles.section}>
          <MotiView
            from={{ translateX: -30, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            transition={{ delay: 300 }}
          >
            <Text style={styles.sectionTitle}>📚 Study Overview (Last 7 Days)</Text>
          </MotiView>
          
          <GlassCard intensity="medium" delay={350}>
            <View style={styles.studyStatRow}>
              <Text style={styles.studyStatLabel}>Total Hours:</Text>
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 400 }}
              >
                <Text style={styles.studyStatValue}>{studyStats.totalHours.toFixed(1)}h</Text>
              </MotiView>
            </View>
            <View style={styles.studyStatRow}>
              <Text style={styles.studyStatLabel}>Study Sessions:</Text>
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 450 }}
              >
                <Text style={styles.studyStatValue}>{studyStats.totalSessions}</Text>
              </MotiView>
            </View>
            <View style={styles.studyStatRow}>
              <Text style={styles.studyStatLabel}>Study Streak:</Text>
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 500 }}
              >
                <Text style={[styles.studyStatValue, { color: COLORS_V2.warning[500] }]}>
                  {studyStats.studyStreak} days 🔥
                </Text>
              </MotiView>
            </View>
          </GlassCard>
        </View>
      )}

      {/* At-Risk Tasks */}
      {predictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Tasks Needing Attention</Text>
          {predictions.map((prediction, index) => {
            const task = tasks.find(t => t.id === prediction.taskId);
            if (!task) return null;
            
            const riskColor = 
              prediction.riskLevel === 'high' ? COLORS_V2.error[500] :
              prediction.riskLevel === 'medium' ? COLORS_V2.warning[500] :
              COLORS_V2.success[500];

            return (
              <AnimatedCard
                key={index}
                delay={index * 100}
                style={{ borderLeftColor: riskColor, borderLeftWidth: 4 }}
                onPress={() => router.push(`/tasks/${task.id}` as any)}
              >
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.prediction}>{prediction.prediction}</Text>
                <Text style={styles.daysRemaining}>
                  {prediction.daysRemaining} days remaining • {prediction.recommendedHoursPerDay.toFixed(1)}h/day needed
                </Text>
              </AnimatedCard>
            );
          })}
        </View>
      )}

      {/* My Courses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 My Courses</Text>
          <View style={styles.courseHeaderActions}>
            {courses.length > 0 && (
              <TouchableOpacity onPress={() => setShowCoursesModal(true)}>
                <Text style={styles.viewAllButton}>View All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/courses/add' as any)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {courses.length === 0 ? (
          <TouchableOpacity 
            style={styles.emptyCourseState}
            onPress={() => router.push('/courses/add' as any)}
          >
            <Image 
              source={ILLUSTRATIONS.emptyCourses}
              style={styles.emptyStateImage}
              contentFit="contain"
            />
            <Text style={styles.emptyCourseTitle}>No courses yet</Text>
            <Text style={styles.emptyCourseSubtitle}>Tap to add your first course</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.coursesScroll}
            contentContainerStyle={{ paddingRight: SPACING.lg }}
          >
            {courses.map((course, index) => {
              const courseTasks = tasks.filter(t => t.courseId === course.id);
              const completedTasks = courseTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
              const pendingTasks = courseTasks.length - completedTasks;
              
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  backgroundImage={ILLUSTRATIONS[`heroStudy${(index % 7) + 1}` as keyof typeof ILLUSTRATIONS]}
                  totalTasks={courseTasks.length}
                  completedTasks={completedTasks}
                  pendingTasks={pendingTasks}
                  onPress={() => router.push(`/tasks?courseId=${course.id}` as any)}
                  onAddTask={() => router.push(`/tasks/add?courseId=${course.id}` as any)}
                  delay={index * 100}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Upcoming Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Upcoming Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/tasks' as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingTasks.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 400 }}
          >
            <View style={styles.emptyState}>
              <Image 
                source={ILLUSTRATIONS.taskComplete}
                style={styles.emptyTaskImage}
                contentFit="contain"
              />
              <Text style={styles.emptyStateText}>No upcoming tasks! 🎉</Text>
            </View>
          </MotiView>
        ) : (
          upcomingTasks.map((task, index) => {
            const course = courses.find(c => c.id === task.courseId);
            
            return (
              <TaskCard
                key={task.id}
                task={task}
                courseName={course?.name}
                courseColor={course?.color}
                onPress={() => router.push(`/tasks/${task.id}` as any)}
                delay={index * 80}
              />
            );
          })
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { icon: '➕', label: 'Add Task', route: '/tasks/add' },
            { icon: '📚', label: 'Add Course', route: '/courses/add' },
            { icon: '📝', label: 'All Tasks', route: '/tasks' },
            { icon: '📚', label: 'All Courses', action: () => setShowCoursesModal(true) },
            { icon: '📅', label: 'Study Planner', route: '/planner' },
            { icon: '🕐', label: 'Timetable', route: '/timetable' },
          ].map((action, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, scale: 0.8, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{
                type: 'spring',
                delay: index * 50,
                damping: 15,
              }}
              style={{ width: (width - 48) / 2 }}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (action.route) {
                    router.push(action.route as any);
                  } else if (action.action) {
                    action.action();
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    </ScrollView>

    {/* Floating Chat Assistant Button */}
    {showChatButton && (
      <MotiView
        from={{ scale: 0, opacity: 0, translateX: 100 }}
        animate={{ scale: 1, opacity: 1, translateX: 0 }}
        exit={{ scale: 0, opacity: 0, translateX: 100 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150 }}
        style={styles.chatFab}
      >
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/chat' as any);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.chatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.chatIcon}>🤖</Text>
          </LinearGradient>
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      </MotiView>
    )}

    {/* Courses Modal */}
    <Modal
      visible={showCoursesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCoursesModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Courses</Text>
            <TouchableOpacity onPress={() => setShowCoursesModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalContent}
            renderItem={({ item: course }) => {
              const courseTasks = tasks.filter(t => t.courseId === course.id);
              const completedTasks = courseTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
              const pendingTasks = courseTasks.length - completedTasks;
              const completionRate = courseTasks.length > 0 
                ? Math.round((completedTasks / courseTasks.length) * 100) 
                : 0;

              return (
                <TouchableOpacity
                  style={styles.modalCourseCard}
                  onPress={() => {
                    setShowCoursesModal(false);
                    router.push(`/tasks/add?courseId=${course.id}` as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalCourseColor, { backgroundColor: course.color || COLORS.primary }]} />
                  
                  <View style={styles.modalCourseContent}>
                    <View style={styles.modalCourseHeader}>
                      <View style={styles.modalCourseInfo}>
                        <Text style={styles.modalCourseCode}>{course.code}</Text>
                        {course.credits && (
                          <View style={[styles.modalCreditsBadge, { backgroundColor: course.color || COLORS.primary }]}>
                            <Text style={styles.modalCreditsText}>{course.credits} CR</Text>
                          </View>
                        )}
                      </View>
                      {course.difficulty && (
                        <View style={styles.difficultyContainer}>
                          {[...Array(5)].map((_, index) => (
                            <Text
                              key={index}
                              style={[
                                styles.difficultyStar,
                                { opacity: index < course.difficulty! ? 1 : 0.3 }
                              ]}
                            >
                              ⭐
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.modalCourseName} numberOfLines={2}>
                      {course.name}
                    </Text>
                    
                    {course.instructor && (
                      <Text style={styles.modalCourseInstructor} numberOfLines={1}>
                        👨‍🏫 {course.instructor}
                      </Text>
                    )}

                    <View style={styles.modalCourseStats}>
                      <View style={styles.modalStatBox}>
                        <Text style={styles.modalStatValue}>{courseTasks.length}</Text>
                        <Text style={styles.modalStatLabel}>Tasks</Text>
                      </View>
                      <View style={styles.modalStatBox}>
                        <Text style={[styles.modalStatValue, { color: COLORS.success }]}>
                          {completedTasks}
                        </Text>
                        <Text style={styles.modalStatLabel}>Done</Text>
                      </View>
                      <View style={styles.modalStatBox}>
                        <Text style={[styles.modalStatValue, { color: COLORS.warning }]}>
                          {pendingTasks}
                        </Text>
                        <Text style={styles.modalStatLabel}>Pending</Text>
                      </View>
                      <View style={styles.modalStatBox}>
                        <Text style={[styles.modalStatValue, { color: COLORS.primary }]}>
                          {completionRate}%
                        </Text>
                        <Text style={styles.modalStatLabel}>Rate</Text>
                      </View>
                    </View>

                    <View style={styles.modalCourseActions}>
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: course.color || COLORS.primary }]}
                        onPress={() => {
                          setShowCoursesModal(false);
                          router.push(`/tasks/add?courseId=${course.id}` as any);
                        }}
                      >
                        <Text style={styles.modalActionText}>+ Add Task</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
                        onPress={() => {
                          setShowCoursesModal(false);
                          router.push(`/tasks?courseId=${course.id}` as any);
                        }}
                      >
                        <Text style={[styles.modalActionText, { color: COLORS.primary }]}>
                          View Tasks
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyModalState}>
                <Text style={styles.emptyModalIcon}>📚</Text>
                <Text style={styles.emptyModalText}>No courses yet</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.modalAddButton}
            onPress={() => {
              setShowCoursesModal(false);
              router.push('/courses/add' as any);
            }}
          >
            <Text style={styles.modalAddButtonText}>+ Add New Course</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_V2.background.primary,
  },
  loadingContainer: {
    flex: 1,
  },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    paddingTop: SPACING.massive,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
  },
  headerContent: {
    zIndex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS_V2.text.inverse,
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS_V2.text.inverse,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    justifyContent: 'space-between',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS_V2.text.primary,
    fontWeight: '700',
  },
  seeAll: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.primary[600],
    fontWeight: '600',
  },
  studyStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  studyStatLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS_V2.text.secondary,
  },
  studyStatValue: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS_V2.text.primary,
  },
  taskTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    marginBottom: SPACING.xs,
  },
  prediction: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS_V2.text.secondary,
    marginTop: SPACING.sm,
  },
  daysRemaining: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS_V2.text.tertiary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    padding: SPACING.huge,
    alignItems: 'center',
  },
  emptyTaskImage: {
    width: 140,
    height: 140,
    marginBottom: SPACING.lg,
  },
  emptyStateText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS_V2.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...ELEVATION.md,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.text.primary,
  },
  addButton: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.primary[600],
    fontWeight: '600',
  },
  emptyCourseState: {
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.xl,
    padding: SPACING.huge,
    alignItems: 'center',
    ...ELEVATION.md,
  },
  emptyStateImage: {
    width: 180,
    height: 180,
    marginBottom: SPACING.lg,
  },
  emptyCourseTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyCourseSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS_V2.text.secondary,
    textAlign: 'center',
  },
  coursesScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  courseHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.secondary[600],
    fontWeight: '600',
    marginRight: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS_V2.surface.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS_V2.surface.base,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS_V2.border.light,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineSmall,
    color: COLORS_V2.text.primary,
  },
  modalClose: {
    fontSize: 28,
    color: COLORS_V2.text.secondary,
    fontWeight: '300',
  },
  modalContent: {
    padding: SPACING.lg,
  },
  modalCourseCard: {
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...ELEVATION.md,
    flexDirection: 'row',
  },
  modalCourseColor: {
    width: 8,
  },
  modalCourseContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  modalCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalCourseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCourseCode: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS_V2.text.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginRight: SPACING.sm,
  },
  modalCreditsBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  modalCreditsText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS_V2.text.inverse,
    fontWeight: '700',
  },
  difficultyContainer: {
    flexDirection: 'row',
  },
  difficultyStar: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  modalCourseName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    marginBottom: SPACING.xs,
    lineHeight: 22,
  },
  modalCourseInstructor: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS_V2.text.secondary,
    marginBottom: SPACING.md,
  },
  modalCourseStats: {
    flexDirection: 'row',
    backgroundColor: COLORS_V2.background.tertiary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatValue: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs / 2,
  },
  modalStatLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS_V2.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalCourseActions: {
    flexDirection: 'row',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  modalActionButtonSecondary: {
    backgroundColor: COLORS_V2.background.tertiary,
  },
  modalActionText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.text.inverse,
    fontWeight: '600',
  },
  emptyModalState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyModalIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyModalText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS_V2.text.secondary,
  },
  modalAddButton: {
    backgroundColor: COLORS_V2.primary[500],
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...ELEVATION.md,
  },
  modalAddButtonText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '700',
    color: COLORS_V2.text.inverse,
  },
  // Floating Chat Assistant Button
  chatFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 999,
  },
  chatButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...ELEVATION.xl,
  },
  chatGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 28,
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: COLORS_V2.background.primary,
    ...ELEVATION.md,
  },
  chatBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
