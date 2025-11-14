/**
 * ChatInput Component
 * Modern chat input following mobile UX best practices
 * Keyboard-safe, auto-resize, smooth animations
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants/config';

export interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachImage?: () => void;
  onAttachDocument?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onAttachImage,
  onAttachDocument,
  placeholder = 'Message UniMate...',
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(0)).current;

  const handleTextChange = (value: string) => {
    setText(value);
    
    // Animate send button
    Animated.spring(sendButtonScale, {
      toValue: value.trim().length > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handleSend = () => {
    if (text.trim().length === 0 || disabled) return;

    const message = text.trim();
    setText('');
    setInputHeight(40);
    
    // Animate send button out
    Animated.spring(sendButtonScale, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();

    onSend(message);
    Keyboard.dismiss();
  };

  const handleContentSizeChange = (event: any) => {
    const height = event.nativeEvent.contentSize.height;
    // Max 5 lines (approximately 120px)
    setInputHeight(Math.min(Math.max(40, height), 120));
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Attachment Buttons */}
        <View style={styles.attachmentButtons}>
          {onAttachImage && (
            <TouchableOpacity
              onPress={onAttachImage}
              style={styles.attachButton}
              disabled={disabled}
              accessible={true}
              accessibilityLabel="Attach image"
              accessibilityRole="button"
            >
              <Ionicons 
                name="image-outline" 
                size={22} 
                color={disabled ? '#CCC' : COLORS.primary} 
              />
            </TouchableOpacity>
          )}
          {onAttachDocument && (
            <TouchableOpacity
              onPress={onAttachDocument}
              style={styles.attachButton}
              disabled={disabled}
              accessible={true}
              accessibilityLabel="Attach document"
              accessibilityRole="button"
            >
              <Ionicons 
                name="document-outline" 
                size={22} 
                color={disabled ? '#CCC' : COLORS.primary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Text Input */}
        <View style={[styles.inputWrapper, { minHeight: inputHeight }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { height: inputHeight }]}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={text}
            onChangeText={handleTextChange}
            onContentSizeChange={handleContentSizeChange}
            multiline
            maxLength={2000}
            editable={!disabled}
            returnKeyType="default"
            blurOnSubmit={false}
            accessible={true}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message to the AI assistant"
          />
        </View>

        {/* Send Button */}
        <Animated.View
          style={[
            styles.sendButtonContainer,
            {
              opacity: sendButtonScale,
              transform: [
                { scale: sendButtonScale },
                {
                  rotate: sendButtonScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['45deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
            ]}
            disabled={!canSend}
            accessible={true}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend }}
          >
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachmentButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1F1F1F',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButtonContainer: {
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});
