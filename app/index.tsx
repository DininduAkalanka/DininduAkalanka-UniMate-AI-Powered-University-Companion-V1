import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';
import { ILLUSTRATIONS } from '../constants/illustrations';
import { signIn, signUp } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const user = await signIn(email, password);
      
      Alert.alert(
        'Welcome Back!',
        `Welcome back, ${user.name}!`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error?.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (error?.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error?.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error?.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(error?.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const user = await signUp(email, password, name);
      
      Alert.alert(
        'Account Created!',
        `Welcome to UniMate, ${user.name}! Let's get started.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      if (error?.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error?.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (error?.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(error?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Image 
        source={ILLUSTRATIONS.heroStudy3}
        style={styles.backgroundImage}
        contentFit="cover"
        contentPosition="center"
        priority="high"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.25)', 'rgba(255,255,255,0.85)']}
        style={styles.gradientOverlay}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar style="dark" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>🎓</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>UniMate</Text>
            <Text style={styles.tagline}>Your AI-Powered Study Companion</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>
              {isSignUpMode ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUpMode 
                ? 'Sign up to get started with UniMate' 
                : 'Sign in to continue your learning journey'}
            </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {isSignUpMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {isSignUpMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}

            {!isSignUpMode && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [COLORS.textSecondary, COLORS.textSecondary] : [COLORS.primary, COLORS.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUpMode ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUpMode ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setError('');
                  setName('');
                  setConfirmPassword('');
                }}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>
                  {isSignUpMode ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>

          <View style={styles.features}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🤖</Text>
              </View>
              <Text style={styles.featureText}>AI Study Assistant</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>📊</Text>
              </View>
              <Text style={styles.featureText}>Smart Analytics</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>⏰</Text>
              </View>
              <Text style={styles.featureText}>Deadline Predictions</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 32,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  glassmorphicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  heroImage: {
    width: width * 0.6,
    height: 180,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  logoBadge: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 13,
    color: '#2d2d2d',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.98)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 0,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(88, 86, 214, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 13,
  },
});
