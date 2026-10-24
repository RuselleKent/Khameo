import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import LinkText from '../../components/LinkText';
import * as api from '../../services/auth';
import { validateEmail } from '../../utils/validators';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null); // { devToken }

  async function onSend() {
    const v = validateEmail(email);
    setError(v);
    if (v) return;
    setLoading(true);
    const res = await api.forgotPassword({ email });
    setLoading(false);
    if (!res.ok) return setError(res.message);
    setSent(res);
  }

  return (
    <Screen title="Forgot Password?" subtitle="Enter your email to receive a reset link.">
      <Field label="Email Address" placeholder="ex. khameo@gmail.com" value={email} onChangeText={(t) => { setEmail(t); setSent(null); }} keyboardType="email-address" error={error} />
      {sent ? <Text>Reset link sent to {email.trim()}. Check your inbox.</Text> : null}
      <Button title={sent ? 'Resend Reset Link' : 'Send Reset Link'} onPress={onSend} loading={loading} />
      {/* DEV ONLY: stands in for tapping the link in the email. Delete when Laravel sends real emails. */}
      {sent ? (
        <LinkText onPress={() => router.push({ pathname: '/reset-password', params: { token: sent.devToken } })}>
          (dev) Open the reset link from the email
        </LinkText>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Text>Remember your password?</Text>
        <LinkText onPress={() => router.replace('/login')}>Sign In</LinkText>
      </View>
    </Screen>
  );
}
