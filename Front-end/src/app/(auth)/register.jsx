import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import LinkText from '../../components/LinkText';
import * as api from '../../services/auth';
import { validateEmail, validatePassword, validateConfirm } from '../../utils/validators';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function onCreate() {
    const e = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    };
    setErrors(e);
    if (e.email || e.password || e.confirm) return;
    setLoading(true);
    const res = await api.register({ email, password, confirm });
    setLoading(false);
    if (!res.ok) return setErrors({ [res.field || 'email']: res.message });
    router.push({ pathname: '/verify-code', params: { email: res.email } });
  }

  async function onGoogle() {
    setLoading(true);
    const res = await api.googleSignIn();
    setLoading(false);
    if (!res.ok) return setErrors({ email: res.message });
    router.push('/account-connected');
  }

  return (
    <Screen title="Create Account" subtitle="Join us today! It's quick and easy.">
      <Field label="Email Address" placeholder="ex. khameo@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} />
      <Field label="Password" placeholder="Enter your password" secure value={password} onChangeText={setPassword} error={errors.password} />
      <Field label="Confirm Password" placeholder="Confirm your password" secure value={confirm} onChangeText={setConfirm} error={errors.confirm} />
      <Text>By signing up, you agree to Khameo's Terms & Conditions and Privacy Policy</Text>
      <Button title="Create Account" onPress={onCreate} loading={loading} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Text>Already have an account?</Text>
        <LinkText onPress={() => router.replace('/login')}>Sign In</LinkText>
      </View>
      <Text>Or sign up with</Text>
      <Button title="Google Account" onPress={onGoogle} disabled={loading} />
    </Screen>
  );
}
