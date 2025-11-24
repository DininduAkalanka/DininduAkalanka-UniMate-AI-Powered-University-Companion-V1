

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS_V2, ELEVATION, RADIUS, SPACING, TYPOGRAPHY } from '../constants/designSystem';
import { ILLUSTRATIONS } from '../constants/illustrations';
import { globalCache, useOptimizedData } from '../hooks/useOptimizedData';
import { getCourses } from '../services/courseServiceFirestore';
import { predictDeadlineRisks } from '../services/predictionService';
import { getStudyStats } from '../services/studyServiceFirestore';
import { getTasks } from '../services/taskServiceFirestore';
import { Course, DeadlinePrediction, Task, TaskStatus } from '../types';
import { CourseCard } from './ui/CourseCard';
import { Skeleton, SkeletonCard, SkeletonStatCard } from './ui/Skeleton';
import { StatCard } from './ui/StatCard';
import { TaskCard } from './ui/TaskCard';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - SPACING.xl * 2;

interface DashboardProps {
  userId: string;
}

// Memoized components
const MemoizedStatCard = memo(StatCard);
const MemoizedTaskCard = memo(TaskCard);
const MemoizedCourseCard = memo(CourseCard);

// ✅ UX IMPROVEMENT 1: Smart time-based greeting
function getTimeBasedGreeting(): { emoji: string; greeting: string; message: string } {
  const hour = new Date().getHours();
  
  if (hour < 5) {
    return { 
      emoji: '🌙', 
      greeting: 'Burning the midnight oil?', 
      message: "Don't forget to rest!" 
    };
  } else if (hour < 12) {
    return { 
      emoji: '☀️', 
      greeting: 'Good morning!', 
      message: "Let's make today count" 
    };
  } else if (hour < 17) {
    return { 
      emoji: '🌤️', 
      greeting: 'Good afternoon!', 
      message: "You're doing great" 
    };
  } else if (hour < 22) {
    return { 
      emoji: '🌆', 
      greeting: 'Good evening!', 
      message: "Almost there, keep going" 
    };
  } else {
    return { 
      emoji: '🌃', 
      greeting: 'Working late?', 
      message: "Rest is important too" 
    };
  }
}

// ✅ UX IMPROVEMENT 2: Smart insights based on data
function getSmartInsight(stats: any, predictions: DeadlinePrediction[]): {
  icon: string;
  text: string;
  type: 'success' | 'warning' | 'info';
} {
  const { total, completed, overdue, upcoming } = stats;
  
  // Priority: Overdue > At-risk > Upcoming > Success
  if (overdue > 0) {
    return {
      icon: '⚠️',
      text: `${overdue} task${overdue > 1 ? 's' : ''} overdue - Let's tackle ${overdue === 1 ? 'it' : 'them'} now!`,
      type: 'warning',
    };
  }
  
  if (predictions.length > 0 && predictions[0].riskLevel === 'high') {
    return {
      icon: '🔥',
      text: `${predictions.length} deadline${predictions.length > 1 ? 's' : ''} at risk - Stay focused!`,
      type: 'warning',
    };
  }
  
  if (upcoming > 0) {
    return {
      icon: '📅',
      text: `${upcoming} task${upcoming > 1 ? 's' : ''} due this week - You've got this!`,
      type: 'info',
    };
  }
  
  if (completed === total && total > 0) {
    return {
      icon: '🎉',
      text: "All tasks completed! You're amazing!",
      type: 'success',
    };
  }
  
  if (total === 0) {
    return {
      icon: '✨',
      text: 'Ready to start? Add your first task!',
      type: 'info',
    };
  }
  
  const completionRate = Math.round((completed / total) * 100);
  if (completionRate >= 80) {
    return {
      icon: '💪',
      text: `${completionRate}% complete - Almost there!`,
      type: 'success',
    };
  }
  
  return {
    icon: '🚀',
    text: `${completionRate}% complete - Keep the momentum!`,
    type: 'info',
  };
}

// ✅ UX IMPROVEMENT 3: Floating Action Button for primary action
const FloatingActionButton = memo(({ onPress }: { onPress: () => void }) => (
  <MotiView
    from={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', delay: 400, damping: 15 }}
    style={styles.fab}
  >
    <TouchableOpacity
      style={styles.fabButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.fabGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="sparkles" size={26} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  </MotiView>
));

// ✅ UX IMPROVEMENT 4: Compact Quick Action Chip
const QuickActionChip = memo(({ 
  icon, 
  label, 
  onPress,
  color = COLORS_V2.primary[500],
}: { 
  icon: string; 
  label: string; 
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity
    style={styles.quickChip}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    activeOpacity={0.7}
  >
    <View style={[styles.quickChipIconContainer, { backgroundColor: `${color}15` }]}>
      <Text style={styles.quickChipIcon}>{icon}</Text>
    </View>
    <Text style={styles.quickChipLabel} numberOfLines={1}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={COLORS_V2.text.tertiary} />
  </TouchableOpacity>
));

// ✅ UX IMPROVEMENT 5: Smart insight banner
const InsightBanner = memo(({ 
  icon, 
  text, 
  type 
}: { 
  icon: string; 
  text: string; 
  type: 'success' | 'warning' | 'info';
}) => {
  const backgroundColor = 
    type === 'success' ? COLORS_V2.success[50] :
    type === 'warning' ? COLORS_V2.warning[50] :
    COLORS_V2.info[50];
    
  const borderColor = 
    type === 'success' ? COLORS_V2.success[500] :
    type === 'warning' ? COLORS_V2.warning[500] :
    COLORS_V2.info[500];

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <View style={[styles.insightBanner, { backgroundColor, borderLeftColor: borderColor }]}>
        <Text style={styles.insightIcon}>{icon}</Text>
        <Text style={styles.insightText}>{text}</Text>
      </View>
    </MotiView>
  );
});

// ✅ UX IMPROVEMENT 6: Progress Ring Component (React Native compatible)
const ProgressRing = memo(({ 
  percentage, 
  size = 56,
}: { 
  percentage: number;
  size?: number;
}) => {
  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <View style={styles.progressRingBackground}>
        <View 
          style={[
            styles.progressRingFill,
            { 
              height: `${percentage}%`,
            }
          ]} 
        />
      </View>
      <View style={styles.progressRingCenter}>
        <Text style={styles.progressRingText}>{percentage}%</Text>
      </View>
    </View>
  );
});

export default function DashboardEnhanced({ userId }: DashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyStats, setStudyStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<DeadlinePrediction[]>([]);

  const { courseMap, taskStatsByCourse, tasksByStatus, globalStats } = useOptimizedData(tasks, courses);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('[Dashboard.enhanced] Loading tasks...');
      const tasksData = await getTasks(userId);
      console.log('[Dashboard.enhanced] Tasks loaded:', tasksData.length);
      
      console.log('[Dashboard.enhanced] Loading courses...');
      const coursesData = await getCourses(userId);
      console.log('[Dashboard.enhanced] Courses loaded:', coursesData.length);
      
      console.log('[Dashboard.enhanced] Loading study stats...');
      let studyData = null;
      try {
        studyData = await getStudyStats(userId, 7);
        console.log('[Dashboard.enhanced] Study stats loaded');
      } catch (studyStatsError) {
        console.warn('[Dashboard.enhanced] Failed to load study stats:', studyStatsError);
        // Use default stats if it fails
        studyData = {
          totalHours: 0,
          totalSessions: 0,
          averageSessionDuration: 0,
          mostStudiedCourse: null,
          studyStreak: 0,
        };
      }

      setTasks(tasksData);
      setCourses(coursesData);
      setStudyStats(studyData);

      console.log('[Dashboard.enhanced] Filtering upcoming tasks...');
      const upcomingTasks = tasksData
        .filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate > new Date())
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 5);
      
      if (upcomingTasks.length > 0) {
        console.log('[Dashboard.enhanced] Loading predictions for', upcomingTasks.length, 'tasks...');
        const predictionsData = await predictDeadlineRisks(upcomingTasks);
        console.log('[Dashboard.enhanced] Predictions loaded:', predictionsData.length);
        setPredictions(predictionsData.slice(0, 3));
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const lastRefreshRef = React.useRef(0);
  const onRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 1000) return;
    
    lastRefreshRef.current = now;
    setRefreshing(true);
    globalCache.clear();
    loadDashboardData();
  }, [userId]);



  const upcomingTasks = useMemo(() => 
    tasksByStatus.upcoming,
    [tasksByStatus.upcoming]
  );

  // ✅ Get smart greeting and insight
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const insight = useMemo(() => 
    getSmartInsight(globalStats, predictions), 
    [globalStats, predictions]
  );

  // ✅ Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (globalStats.total === 0) return 0;
    return Math.round((globalStats.completed / globalStats.total) * 100);
  }, [globalStats]);

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.header}>
            <Skeleton height={160} borderRadius={0} />
          </View>
          
          <View style={styles.statsSection}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
          
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ✅ ENHANCED HEADER - More compact, personalized */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
              <View>
                <Text style={styles.greetingText}>{greeting.greeting}</Text>
                <Text style={styles.greetingSubtext}>{greeting.message}</Text>
              </View>
            </View>
            
            {/* ✅ Progress Ring in header */}
            <ProgressRing 
              percentage={completionPercentage}
              size={56}
            />
          </View>
          
          {/* ✅ Date indicator */}
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* ✅ SMART INSIGHT BANNER */}
        <View style={styles.insightContainer}>
          <InsightBanner 
            icon={insight.icon}
            text={insight.text}
            type={insight.type}
          />
        </View>

        {/* ✅ COMPACT STATS - Horizontal Scroll */}
        <View style={styles.statsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
          >
            <MemoizedStatCard
              icon="📋"
              value={globalStats.total}
              label="Total"
              backgroundImage={undefined}
              gradientColors={[COLORS_V2.primary[400], COLORS_V2.primary[600]]}
              delay={0}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/tasks' as any);
              }}
            />
            
            <MemoizedStatCard
              icon="✓"
              value={globalStats.completed}
              label="Done"
              backgroundImage={undefined}
              gradientColors={[COLORS_V2.success[400], COLORS_V2.success[600]]}
              delay={50}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/tasks?filter=completed' as any);
              }}
            />
            
            <MemoizedStatCard
              icon="⚠️"
              value={globalStats.overdue}
              label="Overdue"
              backgroundImage={undefined}
              gradientColors={[COLORS_V2.error[400], COLORS_V2.error[600]]}
              delay={100}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/tasks?filter=overdue' as any);
              }}
            />

            {studyStats && studyStats.totalHours > 0 && (
              <MemoizedStatCard
                icon="📚"
                value={Math.round(studyStats.totalHours)}
                label="Study Hours"
                backgroundImage={undefined}
                gradientColors={[COLORS_V2.info[400], COLORS_V2.info[600]]}
                delay={150}
              />
            )}
          </ScrollView>
        </View>

        {/* ✅ QUICK ACTIONS - Compact horizontal chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionChip
              icon="⏱️"
              label="Study Session"
              onPress={() => router.push('/study-session')}
              color="#10B981"
            />
            <QuickActionChip
              icon="➕"
              label="Add Task"
              onPress={() => router.push('/tasks/add' as any)}
              color={COLORS_V2.primary[500]}
            />
            <QuickActionChip
              icon="📚"
              label="Add Course"
              onPress={() => router.push('/courses/add' as any)}
              color={COLORS_V2.secondary[500]}
            />
            <QuickActionChip
              icon="📅"
              label="Study Planner"
              onPress={() => router.push('/planner' as any)}
              color={COLORS_V2.info[500]}
            />
            <QuickActionChip
              icon="🕐"
              label="Timetable"
              onPress={() => router.push('/timetable' as any)}
              color={COLORS_V2.warning[500]}
            />
          </View>
        </View>

        {/* ✅ MY COURSES - Horizontal scroll (max 3) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 My Courses</Text>
            {courses.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/courses' as any)}>
                <Text style={styles.seeAllButton}>See All ({courses.length}) →</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {courses.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptyState}
              onPress={() => router.push('/courses/add' as any)}
            >
              <Image 
                source={ILLUSTRATIONS.emptyCourses}
                style={styles.emptyImage}
                contentFit="contain"
              />
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptySubtitle}>Tap to add your first course</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.coursesScroll}
            >
              {courses.slice(0, 3).map((course, index) => {
                const courseStats = taskStatsByCourse.get(course.id) || { total: 0, completed: 0, pending: 0 };
                
                return (
                  <MemoizedCourseCard
                    key={course.id}
                    course={course}
                    backgroundImage={ILLUSTRATIONS[`heroStudy${(index % 7) + 1}` as keyof typeof ILLUSTRATIONS]}
                    totalTasks={courseStats.total}
                    completedTasks={courseStats.completed}
                    pendingTasks={courseStats.pending}
                    onPress={() => router.push(`/tasks?courseId=${course.id}` as any)}
                    onAddTask={() => router.push(`/tasks/add?courseId=${course.id}` as any)}
                    delay={0}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ✅ AT-RISK TASKS - More prominent */}
        {predictions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS_V2.error[500]} />
                <Text style={styles.sectionTitle}>Needs Attention</Text>
              </View>
            </View>
            
            {predictions.map((prediction, index) => {
              const task = tasks.find(t => t.id === prediction.taskId);
              if (!task) return null;
              
              const riskColor = 
                prediction.riskLevel === 'high' ? COLORS_V2.error[500] :
                prediction.riskLevel === 'medium' ? COLORS_V2.warning[500] :
                COLORS_V2.success[500];

              return (
                <TouchableOpacity
                  key={prediction.taskId}
                  style={[styles.atRiskCard, { borderLeftColor: riskColor }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/tasks/${task.id}` as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.atRiskHeader}>
                    <Text style={styles.atRiskTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: `${riskColor}20` }]}>
                      <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                        {prediction.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.atRiskPrediction} numberOfLines={2}>
                    {prediction.prediction}
                  </Text>
                  <View style={styles.atRiskFooter}>
                    <Text style={styles.atRiskDays}>{prediction.daysRemaining} days left</Text>
                    <Text style={styles.atRiskHours}>
                      {prediction.recommendedHoursPerDay.toFixed(1)}h/day needed
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ✅ UPCOMING TASKS - Progressive disclosure */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/tasks' as any)}>
              <Text style={styles.seeAllButton}>See All →</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Image 
                source={ILLUSTRATIONS.taskComplete}
                style={styles.emptyImage}
                contentFit="contain"
              />
              <Text style={styles.emptyTitle}>All clear! 🎉</Text>
              <Text style={styles.emptySubtitle}>No upcoming tasks. Time to relax!</Text>
            </View>
          ) : (
            <>
              {upcomingTasks.slice(0, showAllTasks ? undefined : 3).map((task, index) => {
                const course = courseMap.get(task.courseId);
                
                return (
                  <MemoizedTaskCard
                    key={task.id}
                    task={task}
                    courseName={course?.name}
                    courseColor={course?.color}
                    onPress={() => router.push(`/tasks/${task.id}` as any)}
                    delay={index * 50}
                  />
                );
              })}
              
              {upcomingTasks.length > 3 && !showAllTasks && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllTasks(true)}
                >
                  <Text style={styles.showMoreText}>
                    Show {upcomingTasks.length - 3} more tasks
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS_V2.primary[500]} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ✅ FLOATING ACTION BUTTON - AI CHAT */}
      <FloatingActionButton 
        onPress={() => router.push('/chat')}
      />
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
  
  // ✅ Enhanced Header
  header: {
    padding: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? SPACING.massive : SPACING.xl,
    backgroundColor: COLORS_V2.surface.base,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greetingEmoji: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  greetingText: {
    ...TYPOGRAPHY.headlineSmall,
    color: COLORS_V2.text.primary,
    marginBottom: 2,
  },
  greetingSubtext: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS_V2.text.secondary,
  },
  dateText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS_V2.text.tertiary,
    marginTop: SPACING.xs,
  },
  
  // ✅ Progress Ring
  progressRingContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: COLORS_V2.background.tertiary,
    ...ELEVATION.sm,
  },
  progressRingBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  progressRingFill: {
    backgroundColor: COLORS_V2.primary[500],
    width: '100%',
    borderRadius: 100,
  },
  progressRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    color: COLORS_V2.text.primary,
  },
  
  // ✅ Insight Banner
  insightContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    ...ELEVATION.sm,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  insightText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS_V2.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  
  // ✅ Compact Stats
  statsSection: {
    marginTop: SPACING.lg,
  },
  statsScroll: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  
  // Courses Scroll
  coursesScroll: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  
  // Section
  section: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS_V2.text.primary,
    fontWeight: '700',
  },
  seeAllButton: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.primary[600],
    fontWeight: '600',
  },
  
  // Course Header Actions
  courseHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // ✅ Compact Courses Grid
  coursesGrid: {
    gap: SPACING.md,
  },
  compactCourseCard: {
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...ELEVATION.md,
    marginBottom: SPACING.sm,
  },
  courseColorBar: {
    height: 4,
    width: '100%',
  },
  compactCourseContent: {
    padding: SPACING.lg,
  },
  compactCourseCode: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS_V2.primary[600],
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  compactCourseName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  compactCourseStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  compactStatItem: {
    alignItems: 'center',
  },
  compactStatValue: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    fontWeight: '700',
  },
  compactStatLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS_V2.text.secondary,
    marginTop: SPACING.xs / 2,
  },
  
  // ✅ Quick Action Chips
  quickActionsContainer: {
    gap: SPACING.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...ELEVATION.sm,
    minHeight: 56, // Accessibility: 48dp minimum
  },
  quickChipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  quickChipIcon: {
    fontSize: 20,
  },
  quickChipLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS_V2.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  
  // ✅ At-Risk Cards
  atRiskCard: {
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...ELEVATION.md,
  },
  atRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  atRiskTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  riskBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  riskBadgeText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
  },
  atRiskPrediction: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS_V2.text.secondary,
    marginBottom: SPACING.sm,
  },
  atRiskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  atRiskDays: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS_V2.text.tertiary,
  },
  atRiskHours: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS_V2.primary[600],
    fontWeight: '600',
  },
  
  // ✅ Show More Button
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS_V2.background.secondary,
    borderRadius: RADIUS.md,
  },
  showMoreText: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS_V2.primary[600],
    marginRight: SPACING.xs,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.xl,
    ...ELEVATION.sm,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS_V2.text.secondary,
    textAlign: 'center',
  },
  
  // ✅ Floating Action Button
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: 24,
    zIndex: 999,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...ELEVATION.xl,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
