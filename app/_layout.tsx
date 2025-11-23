import { Stack } from "expo-router";
import { useEffect } from "react";
import { useNotificationInitialization } from "../hooks/useNotificationInitialization";
import { errorTracker, setupGlobalErrorHandler } from "../utils/errorTracking";

export default function RootLayout() {
  // Initialize error tracking on app start
  useEffect(() => {
    errorTracker.initialize();
    setupGlobalErrorHandler();
  }, []);

  // Initialize notification system
  const { initialized, error } = useNotificationInitialization();

  useEffect(() => {
    if (error) {
      console.error('Notification initialization error:', error);
    } else if (initialized) {
      console.log('Notifications initialized successfully');
    }
  }, [initialized, error]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="notification-settings" 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="study-session" 
        options={{ 
          headerShown: false,
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
}
