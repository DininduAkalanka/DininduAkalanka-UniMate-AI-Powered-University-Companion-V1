/**
 * QuickActions Component
 * Suggested prompts and quick action chips
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/config';

export interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  onActionPress: (prompt: string) => void;
}

const defaultActions: QuickAction[] = [
  {
    id: '1',
    label: 'Study Tips',
    icon: 'bulb-outline',
    prompt: 'What are the best study techniques for effective learning?',
  },
  {
    id: '2',
    label: 'Exam Prep',
    icon: 'star-outline',
    prompt: 'Help me prepare for my upcoming exams',
  },
  {
    id: '3',
    label: 'Time Management',
    icon: 'time-outline',
    prompt: 'How can I manage my time better as a student?',
  },
  {
    id: '4',
    label: 'Note Taking',
    icon: 'document-text-outline',
    prompt: 'What are effective note-taking methods?',
  },
  {
    id: '5',
    label: 'Motivation',
    icon: 'fitness-outline',
    prompt: "I'm feeling overwhelmed with my studies. Can you help?",
  },
  {
    id: '6',
    label: 'Focus Help',
    icon: 'eye-outline',
    prompt: 'How to improve my focus and concentration?',
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = defaultActions,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionChip}
            onPress={() => onActionPress(action.prompt)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={action.label}
            accessibilityRole="button"
            accessibilityHint={`Sends prompt: ${action.prompt}`}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={action.icon} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginHorizontal: 4,
  },
  iconContainer: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});
