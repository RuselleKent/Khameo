import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';

// Plain stack: no header, no tab bar, no status bar. AuthProvider gives every screen the login state.
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AuthProvider>
  );
}
