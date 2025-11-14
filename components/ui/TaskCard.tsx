import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ANIMATION, COLORS_V2, ELEVATION, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/designSystem';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    dueDate: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  courseName?: string;
  courseColor?: string;
  onPress?: () => void;
  delay?: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  courseName,
  courseColor = COLORS_V2.primary[500],
  onPress,
  delay = 0,
}) => {
  const daysUntil = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const getDueDateText = () => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  const getDueDateColor = () => {
    if (daysUntil < 0) return COLORS_V2.error[500];
    if (daysUntil === 0) return COLORS_V2.warning[500];
    if (daysUntil <= 2) return COLORS_V2.warning[400];
    return COLORS_V2.info[500];
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: ANIMATION.normal,
        delay,
      }}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          ELEVATION.md,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.indicator, { backgroundColor: courseColor }]} />
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          
          {courseName && (
            <View style={styles.courseTag}>
              <View style={[styles.courseDot, { backgroundColor: courseColor }]} />
              <Text style={styles.courseName} numberOfLines={1}>
                {courseName}
              </Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <View style={[styles.dueDateBadge, { backgroundColor: `${getDueDateColor()}15` }]}>
              <Text style={[styles.dueDate, { color: getDueDateColor() }]}>
                📅 {getDueDateText()}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS_V2.surface.base,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  indicator: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS_V2.text.primary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  courseName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS_V2.text.secondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  dueDate: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
  },
});
