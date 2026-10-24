import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Guard: only logged-in users can see anything inside (main).
export default function MainLayout() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
