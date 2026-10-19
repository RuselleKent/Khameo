import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Plain stack: no header, no tab bar, no status bar. Replaces the Expo starter layout.
export default function RootLayout() {
  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}
