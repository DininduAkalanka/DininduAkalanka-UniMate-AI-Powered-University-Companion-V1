/**
 * EmptyState Component
 * Beautiful welcome screen for new chat sessions
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/config';
import { ILLUSTRATIONS } from '../../constants/illustrations';

export interface EmptyStateProps {
  userName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ userName = 'Student' }) => {
  return (
    <View style={styles.container}>
      <Image
        source={ILLUSTRATIONS.aiChat}
        style={styles.illustration}
        contentFit="contain"
      />
      <Text style={styles.greeting}>Hi {userName}! 👋</Text>
      <Text style={styles.title}>I'm UniMate, Your AI Study Assistant</Text>
      <Text style={styles.description}>
        I'm here to help you succeed in your studies with instant answers, study strategies,
        and personalized guidance — all powered by comprehensive built-in knowledge.
      </Text>

      <View style={styles.featuresContainer}>
        <Feature icon="📚" title="Study Strategies" description="Proven techniques for learning" />
        <Feature icon="⏰" title="Time Management" description="Organize and prioritize tasks" />
        <Feature icon="🎯" title="Exam Preparation" description="Ace your tests with confidence" />
        <Feature icon="💪" title="Motivation & Support" description="Stay focused and inspired" />
      </View>

      <Text style={styles.cta}>Ask me anything to get started!</Text>
    </View>
  );
};

const Feature: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.feature}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cta: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    textAlign: 'center',
  },
});
