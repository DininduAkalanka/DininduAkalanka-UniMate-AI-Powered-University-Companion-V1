import { Stack } from "expo-router";

export default function RootLayout() {
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
