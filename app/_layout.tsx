import { Stack } from "expo-router";
import { useEffect } from "react";
import { errorTracker, setupGlobalErrorHandler } from "../utils/errorTracking";

export default function RootLayout() {
  // Initialize error tracking on app start
  useEffect(() => {
    errorTracker.initialize();
    setupGlobalErrorHandler();
  }, []);

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
    </Stack>
  );
}
