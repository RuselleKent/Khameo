import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

// Placeholder. Replace with your real home screen.
export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  return (
    <Screen title="Home" subtitle="You are logged in.">
      <Text>{user?.email}</Text>
      <Button title="Log out" onPress={async () => { await signOut(); router.replace('/login'); }} />
    </Screen>
  );
}
