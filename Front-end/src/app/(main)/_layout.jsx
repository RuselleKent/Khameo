import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Guard: ang naka-login lang ang makakakita ng laman ng (main).
export default function MainLayout() {
    const { user, ready } = useAuth();

    if (!ready) return null; // hinihintay pa kung may naka-save na session
    if (!user) return <Redirect href="/login" />;

    return <Stack screenOptions={{ headerShown: false }} />;
}
