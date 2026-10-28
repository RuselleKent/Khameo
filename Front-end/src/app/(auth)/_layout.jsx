import { Stack } from 'expo-router';

// Layout ng lahat ng login-related screens (login, register, verify, atbp.)
export default function AuthLayout() {
    return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
