import { useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import * as api from '../../services/auth';
import { validatePassword, validateConfirm } from '../../utils/validators';

export default function ResetPassword() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onUpdate() {
    const e = { password: validatePassword(password), confirm: validateConfirm(password, confirm) };
    setErrors(e);
    if (e.password || e.confirm) return;
    setLoading(true);
    const res = await api.resetPassword({ token, email, password, confirm });
    setLoading(false);
    if (!res.ok) return setErrors({ [res.field === 'password' ? 'password' : 'confirm']: res.message });
    setDone(true);
  }

  if (done)
    return (
      <Screen title="Password Reset" subtitle="Your password has been updated successfully.">
        <Text>You can now sign in with your new password.</Text>
        <Button title="Back to Sign In" onPress={() => router.replace('/login')} />
      </Screen>
    );

  return (
    <Screen title="Reset Password" subtitle="Create a new password for your account.">
      <Field label="New Password" placeholder="Enter your new password" secure value={password} onChangeText={setPassword} error={errors.password} />
      <Field label="Confirm Password" placeholder="Confirm your new password" secure value={confirm} onChangeText={setConfirm} error={errors.confirm} />
      <Button title="Update Password" onPress={onUpdate} loading={loading} />
    </Screen>
  );
}
