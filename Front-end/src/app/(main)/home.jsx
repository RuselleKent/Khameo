import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

// Pansamantalang home screen. Palitan ito ng totoong home mo mamaya.
export default function Home() {
    const router = useRouter();
    const { user, signOut } = useAuth();

    async function onLogout() {
        await signOut();
        router.replace('/login');
    }

    return (
        <Screen title="Home" subtitle="You are logged in.">
            <Text>{user?.email}</Text>
            <Button title="Log out" onPress={onLogout} />
        </Screen>
    );
}
