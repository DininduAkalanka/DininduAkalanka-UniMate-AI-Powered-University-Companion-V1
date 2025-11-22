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
    Animated,
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
import { indexAllUserData } from '../../services/ai/ragIndexer';
import { answerWithContext } from '../../services/ai/ragService';
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

  // Separate message histories for normal and RAG modes
  const [normalMessages, setNormalMessages] = useState<Message[]>([]);
  const [ragMessages, setRagMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Student');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [useRAG, setUseRAG] = useState(false); // Toggle between normal AI and RAG
  const [isIndexing, setIsIndexing] = useState(false);

  // Animated values for loading dots
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  // Get current messages based on mode
  const messages = useRAG ? ragMessages : normalMessages;
  const setMessages = useRAG ? setRagMessages : setNormalMessages;

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

      // Normal AI welcome message
      const normalWelcomeMessage: Message = {
        id: 'normal_welcome',
        text: connected
          ? `Hi ${user.name}! 👋\n\nI'm your AI study assistant powered by advanced language models! 🤖\n\n✨ **I can help you with:**\n\n📚 Explaining complex concepts\n💡 Creating study plans\n📝 Summarizing notes\n⏰ Time management tips\n🎯 Exam preparation\n💪 Motivation & support\n\n💭 **Ask me anything like:**\n• "Explain quantum mechanics simply"\n• "Study tips for calculus"\n• "Summarize this text: [paste text]"\n• "Create a study plan for my exam"\n\n🧠 **Tip:** Toggle RAG mode (top right) for context-aware answers using your tasks, courses, and study data!\n\nHow can I help you today?`
          : `Hi ${user.name}! 👋\n\n⚠️ **AI Service Unavailable**\n\nI'm currently running in offline mode with built-in knowledge. To enable full AI capabilities:\n\n1. Get a free API key from huggingface.co/settings/tokens\n2. Add it to your .env file as EXPO_PUBLIC_HF_API_KEY\n3. Restart the app\n\nI can still help with general study advice!`,
        isUser: false,
        timestamp: new Date(),
        avatar: '🤖',
      };

      // RAG mode welcome message
      const ragWelcomeMessage: Message = {
        id: 'rag_welcome',
        text: connected
          ? `Hi ${user.name}! 👋\n\nWelcome to **RAG Mode**! 🧠\n\nI'm now using semantic search across your personal data to provide context-aware answers.\n\n✨ **What makes RAG special:**\n\n🔍 Searches your tasks, courses & study sessions\n📊 Finds relevant context using AI embeddings\n🎯 Provides personalized answers with sources\n✅ Shows confidence scores for each source\n\n💭 **Try asking:**\n• "What are my pending high-priority tasks?"\n• "When is my next exam?"\n• "Create a study plan based on my courses"\n• "What should I focus on this week?"\n\n💡 **First time using RAG?**\nTap the 🔄 button (top right) to index your data!\n\nHow can I help you today?`
          : `Hi ${user.name}! 👋\n\n⚠️ **AI Service Unavailable**\n\nRAG mode requires an active AI connection. Please configure your Hugging Face API key to use this feature.`,
        isUser: false,
        timestamp: new Date(),
        avatar: '🧠',
      };

      setNormalMessages([normalWelcomeMessage]);
      setRagMessages([ragWelcomeMessage]);
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
        let response: { text: string; success: boolean; error?: string; sources?: any[] };

        // Route to RAG or normal AI based on toggle
        if (useRAG) {
          // RAG mode: context-aware answers using semantic search
          const ragResponse = await answerWithContext(text, userId || undefined);
          response = {
            text: ragResponse.answer,
            success: true,
            sources: ragResponse.sources,
          };

          // Add source citations to response if available
          if (ragResponse.sources && ragResponse.sources.length > 0) {
            const citations = ragResponse.sources
              .map((src, idx) => {
                // Format type label
                const typeLabel = {
                  'task': '📋 Task',
                  'course_material': '📚 Course',
                  'study_session': '📖 Study Session',
                  'note': '📝 Note',
                  'chat_history': '💬 Chat'
                }[src.type] || '📄 Item';
                
                // Get title with better fallback
                const title = src.metadata.title || 
                  (src.type === 'task' ? 'Untitled Task' :
                   src.type === 'course_material' ? 'Course Info' :
                   src.type === 'study_session' ? 'Study Session' :
                   'Untitled');
                
                // Format similarity score (0-100%)
                const relevance = ((src.similarity || 0) * 100).toFixed(0);
                
                return `\n[${idx + 1}] ${typeLabel}: ${title} (${relevance}% match)`;
              })
              .join('');
            response.text += `\n\n📚 **Sources:**${citations}`;
          }
        } else {
          // Normal mode: intent-based routing
          const intent = detectIntent(text);

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
              response = await generateAIResponse(text, { userId });
              break;
          }
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

  const handleToggleRAG = () => {
    const newRAGState = !useRAG;
    setUseRAG(newRAGState);

    // Scroll to bottom when switching (shows welcome message)
    setTimeout(() => scrollToBottom(false), 100);

    // Show detailed alert
    Alert.alert(
      newRAGState ? '🧠 RAG Mode Enabled' : '🤖 Normal AI Mode',
      newRAGState
        ? 'Switched to RAG chat! 🎯\n\nYou now have a separate chat using semantic search across your tasks, courses, and study data.\n\n💡 Tip: Tap the 🔄 button to index your data if you haven\'t already!'
        : 'Switched to Normal AI chat! 🤖\n\nYou\'re now in the standard chat with general AI knowledge and intent-based routing.\n\nYour RAG chat history is preserved and available when you switch back.'
    );
  };

  // Start pulsing animation for loading dots
  const startPulseAnimation = () => {
    const createPulse = (dotOpacity: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createPulse(dot1Opacity, 0),
      createPulse(dot2Opacity, 200),
      createPulse(dot3Opacity, 400),
    ]).start();
  };

  const handleIndexData = async () => {
    if (!userId) return;

    setIsIndexing(true);
    startPulseAnimation(); // Start animation
    
    // Add slight delay to show the loading state (better UX)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const result = await indexAllUserData(userId);
      
      Alert.alert(
        '✅ Indexing Complete',
        `Successfully indexed:\n\n📋 ${result.indexed.tasks} tasks\n📚 ${result.indexed.courses} courses\n📖 ${result.indexed.sessions} study sessions\n\nYour RAG system is now up to date!`
      );

      // Add system message to RAG chat only
      const systemMessage: Message = {
        id: `system_${Date.now()}`,
        text: `✅ **Data Indexed Successfully**\n\n📋 ${result.indexed.tasks} tasks\n📚 ${result.indexed.courses} courses\n📖 ${result.indexed.sessions} study sessions\n\nRAG is now ready to answer questions about your data!`,
        isUser: false,
        timestamp: new Date(),
        avatar: '✅',
      };
      setRagMessages((prev) => [systemMessage, ...prev]);
    } catch (error) {
      console.error('Indexing error:', error);
      Alert.alert(
        '❌ Indexing Failed',
        'Failed to index your data. Please try again or check the console for errors.'
      );
    } finally {
      setIsIndexing(false);
      // Reset dot opacities
      dot1Opacity.setValue(0.4);
      dot2Opacity.setValue(0.4);
      dot3Opacity.setValue(0.4);
    }
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
              {typing ? 'AI is thinking...' : useRAG ? 'RAG Chat (Context-Aware) 🧠' : aiConnected ? 'Normal Chat (General AI) 🤖' : 'Offline mode'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {useRAG && (
              <TouchableOpacity
                onPress={handleIndexData}
                style={styles.indexButton}
                disabled={isIndexing}
                accessible={true}
                accessibilityLabel="Index my data"
                accessibilityRole="button"
              >
                {isIndexing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="refresh" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleToggleRAG}
              style={styles.ragToggleButton}
              accessible={true}
              accessibilityLabel={useRAG ? 'Disable RAG mode' : 'Enable RAG mode'}
              accessibilityRole="button"
            >
              <Ionicons name={useRAG ? 'analytics' : 'analytics-outline'} size={24} color="#fff" />
              {useRAG && <View style={styles.ragActiveIndicator} />}
            </TouchableOpacity>
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

      {/* Modern Indexing Loading Overlay */}
      {isIndexing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.loadingTitle}>Indexing Your Data</Text>
            <Text style={styles.loadingSubtitle}>
              Analyzing tasks, courses & study sessions...
            </Text>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
              <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
              <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
            </View>
          </View>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  indexButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ragToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ragActiveIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#fff',
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
  // Modern Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    maxWidth: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  spinnerContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});