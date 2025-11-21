/**
 * Enhanced AI Chat Screen with Real AI Integration
 * Uses Hugging Face models for dynamic responses
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  ChatBubble,
  ChatInput,
  EmptyState,
  QuickActions,
  ScrollToBottomButton,
} from '../../components/chat';
import { COLORS } from '../../constants/config';
import { ILLUSTRATIONS } from '../../constants/illustrations';
import {
  answerQuestion,
  explainConcept,
  generateAIResponse,
  getStudyTips,
  summarizeText,
  testConnection
} from '../../services/aiServiceEnhanced';
import { getCurrentUser } from '../../services/authService';

// Enable LayoutAnimation on Android (only for old architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(global as any).nativeFabricUIManager // Check if NOT using new architecture
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  avatar?: string;
  isError?: boolean;
}

/**
 * Detect user intent from message
 */
function detectIntent(message: string): {
  type: 'summarize' | 'explain' | 'study_tips' | 'question' | 'general';
  content: string;
} {
  const lowerMsg = message.toLowerCase();

  // Summarization
  if (lowerMsg.includes('summarize') || lowerMsg.includes('summary')) {
    const content = message.replace(/summarize|summary/gi, '').trim();
    return { type: 'summarize', content };
  }

  // Explanation
  if (lowerMsg.match(/explain|what is|what are|define/)) {
    const content = message.replace(/explain|what is|what are|define/gi, '').trim();
    return { type: 'explain', content };
  }

  // Study tips
  if (lowerMsg.match(/study tips|how to study|best way to learn|study (for|about)/)) {
    const content = message.replace(/study tips|how to study|best way to learn/gi, '').trim();
    return { type: 'study_tips', content };
  }

  // Questions (has question words)
  if (lowerMsg.match(/\b(how|why|when|where|who|can you|could you|would you)\b/)) {
    return { type: 'question', content: message };
  }

  // General
  return { type: 'general', content: message };
}

export default function AIChatScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Student');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    initialize();
    setupKeyboardListeners();

    return () => {
      Keyboard.removeAllListeners('keyboardWillShow');
      Keyboard.removeAllListeners('keyboardWillHide');
    };
  }, []);

  /**
   * Initialize chat session
   */
  const initialize = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/');
        return;
      }
      setUserId(user.id);
      setUserName(user.name || 'Student');

      // Test AI connection
      const connected = await testConnection();
      setAiConnected(connected);

      const welcomeMessage: Message = {
        id: '1',
        text: connected
          ? `Hi ${user.name}! 👋\n\nI'm your AI study assistant powered by advanced language models! 🤖\n\n✨ **I can help you with:**\n\n📚 Explaining complex concepts\n💡 Creating study plans\n📝 Summarizing notes\n⏰ Time management tips\n🎯 Exam preparation\n💪 Motivation & support\n\n💭 **Ask me anything like:**\n• "Explain quantum mechanics simply"\n• "Study tips for calculus"\n• "Summarize this text: [paste text]"\n• "Create a study plan for my exam"\n\nHow can I help you today?`
          : `Hi ${user.name}! 👋\n\n⚠️ **AI Service Unavailable**\n\nI'm currently running in offline mode with built-in knowledge. To enable full AI capabilities:\n\n1. Get a free API key from huggingface.co/settings/tokens\n2. Add it to your .env file as EXPO_PUBLIC_HF_API_KEY\n3. Restart the app\n\nI can still help with general study advice!`,
        isUser: false,
        timestamp: new Date(),
        avatar: '🤖',
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const setupKeyboardListeners = () => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollToBottom(true);
      }
    );

    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  };

  const scrollToBottom = (animated: boolean = true) => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated });
      setShowScrollButton(false);
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 200);
  };

  /**
   * Enhanced send message handler with AI integration
   */
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId) return;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: text.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [userMessage, ...prev]);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTimeout(() => scrollToBottom(true), 100);

      // Show typing indicator
      setTyping(true);
      const typingMessage: Message = {
        id: 'typing',
        text: '',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
        avatar: '🤖',
      };
      setMessages((prev) => [typingMessage, ...prev]);

      try {
        // Detect intent
        const intent = detectIntent(text);
        let response: { text: string; success: boolean; error?: string };

        // Route to appropriate AI function
        switch (intent.type) {
          case 'summarize':
            if (intent.content.length > 100) {
              response = await summarizeText(intent.content);
            } else {
              response = {
                text: "Please provide the text you'd like me to summarize after the word 'summarize'.",
                success: true,
              };
            }
            break;

          case 'explain':
            response = await explainConcept(intent.content || text);
            break;

          case 'study_tips':
            response = await getStudyTips(intent.content || text);
            break;

          case 'question':
            response = await answerQuestion(text);
            break;

          case 'general':
          default:
            response = await generateAIResponse(text);
            break;
        }

        // Remove typing indicator
        setMessages((prev) => prev.filter((m) => m.id !== 'typing'));

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.text,
          isUser: false,
          timestamp: new Date(),
          avatar: '🤖',
          isError: !response.success,
        };

        setMessages((prev) => [aiMessage, ...prev]);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTimeout(() => scrollToBottom(true), 100);

      } catch (error: any) {
        console.error('AI response error:', error);

        // Remove typing indicator
        setMessages((prev) => prev.filter((m) => m.id !== 'typing'));

        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "⚠️ I encountered an error. Please check:\n\n• Your internet connection\n• API key is configured\n• Try rephrasing your question\n\nI'm still learning and improving!",
          isUser: false,
          timestamp: new Date(),
          avatar: '🤖',
          isError: true,
        };
        setMessages((prev) => [errorMessage, ...prev]);
      } finally {
        setTyping(false);
      }
    },
    [messages, userId]
  );

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  const handleImagePick = async () => {
    Alert.alert(
      'Coming Soon! 📸',
      'Image analysis with AI will be available soon!\n\nFor now, you can:\n• Describe what you need help with\n• Type or paste text directly'
    );
  };

  const handleDocumentPick = async () => {
    Alert.alert(
      'Coming Soon! 📄',
      'PDF analysis will be available in the next update!\n\nFor now:\n• Copy text from your PDFs\n• Paste it here\n• Ask me to summarize or explain!'
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item.text}
      isUser={item.isUser}
      timestamp={item.timestamp}
      isTyping={item.isTyping}
      avatar={item.avatar}
      onLongPress={() => {
        // Future: Add copy, share functionality
      }}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <Image source={ILLUSTRATIONS.heroStudy5} style={styles.headerBackgroundImage} contentFit="cover" />
      <LinearGradient colors={['rgba(88,86,214,0.95)', 'rgba(108,99,255,0.95)']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerText}>AI Study Assistant</Text>
              {aiConnected !== null && (
                <View style={[styles.statusIndicator, { backgroundColor: aiConnected ? '#4ade80' : '#fbbf24' }]} />
              )}
            </View>
            <Text style={styles.headerSubtext}>
              {typing ? 'AI is thinking...' : aiConnected ? 'Powered by AI 🧠' : 'Offline mode'}
            </Text>
          </View>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing AI...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <EmptyState userName={userName} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            inverted
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
          />
        )}

        {messages.length <= 1 && !keyboardVisible && (
          <View style={styles.quickActionsWrapper}>
            <QuickActions
              actions={[
                {
                  id: '1',
                  label: 'Explain Topic',
                  icon: 'bulb-outline',
                  prompt: 'Explain photosynthesis in simple terms',
                },
                {
                  id: '2',
                  label: 'Study Plan',
                  icon: 'calendar-outline',
                  prompt: 'Create a 7-day study plan for my chemistry exam',
                },
                {
                  id: '3',
                  label: 'Study Tips',
                  icon: 'star-outline',
                  prompt: 'What are the best study techniques for memorization?',
                },
                {
                  id: '4',
                  label: 'Summarize',
                  icon: 'document-text-outline',
                  prompt: 'Summarize: [paste your text here]',
                },
              ]}
              onActionPress={handleQuickAction}
            />
          </View>
        )}

        <ScrollToBottomButton visible={showScrollButton} onPress={() => scrollToBottom(true)} />

        <ChatInput
          onSend={handleSend}
          onAttachImage={handleImagePick}
          onAttachDocument={handleDocumentPick}
          disabled={typing}
          isLoading={typing}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  headerWrapper: {
    position: 'relative',
  },
  headerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: 110,
    opacity: 0.3,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    fontSize: 24,
  },
  chatContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  quickActionsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
});