import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Button from '../../components/Button';

// Lalabas kapag na-link na ang Google account sa Khameo account
export default function AccountConnected() {
    const router = useRouter();

    return (
        <Screen
            title="Account Connected"
            subtitle="Your Google account is now linked to your Khameo account."
        >
            <Text>You can now sign in with Google.</Text>
            <Button title="Back to Sign In" onPress={() => router.replace('/login')} />
        </Screen>
    );
}
