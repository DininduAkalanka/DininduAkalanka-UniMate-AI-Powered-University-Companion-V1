/**
 * ChatBubble Component
 * Modern message bubble following OpenAI/ChatGPT design patterns
 * Supports markdown, code blocks, animations, and accessibility
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/config';

export interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  avatar?: string;
  onLongPress?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
  avatar,
  onLongPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessageContent = () => {
    if (isTyping) {
      return <TypingIndicator />;
    }

    // Basic markdown rendering (bold, italic, code)
    const renderFormattedText = () => {
      const parts = message.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      
      return (
        <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
          {parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Text key={index} style={styles.boldText}>
                  {part.slice(2, -2)}
                </Text>
              );
            } else if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <Text key={index} style={styles.italicText}>
                  {part.slice(1, -1)}
                </Text>
              );
            } else if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <Text key={index} style={styles.codeText}>
                  {part.slice(1, -1)}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    };

    return renderFormattedText();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowReverse]}>
        {!isUser && avatar && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={onLongPress}
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
          accessible={true}
          accessibilityLabel={`${isUser ? 'You' : 'AI'} said: ${message}`}
          accessibilityRole="text"
        >
          {renderMessageContent()}
          
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
              {formatTime(timestamp)}
            </Text>
            {isUser && (
              <Ionicons 
                name="checkmark-done" 
                size={14} 
                color="rgba(255,255,255,0.7)" 
                style={styles.readIcon}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/**
 * Typing Indicator Animation
 */
const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      animate(dot1, 0),
      animate(dot2, 150),
      animate(dot3, 300),
    ]);

    animations.start();

    return () => animations.stop();
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  bubbleRowReverse: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarText: {
    fontSize: 18,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F1F1F',
    letterSpacing: 0.2,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 13,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  readIcon: {
    marginLeft: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },
});
