import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { wakeServer } from '../services/auth';

// Pinakalabas na layout ng app. Walang header at walang tab bar.
// Ang AuthProvider ang nagbibigay ng login state sa lahat ng screen.
export default function RootLayout() {
    // Gisingin agad ang backend pagbukas ng app (natutulog ang free Render)
    useEffect(() => {
        wakeServer();
    }, []);

    return (
        <AuthProvider>
            <StatusBar hidden />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </AuthProvider>
    );
}
