import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Button from '../../components/Button';
import LinkText from '../../components/LinkText';
import CodeInput from '../../components/CodeInput';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/auth';
import { CODE_LENGTH, RESEND_SECONDS } from '../../constants/config';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function VerifyCode() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { signIn } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  // one ticking clock for both the resend timer and the lockout
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const locked = now < lockedUntil;
  useEffect(() => { if (lockedUntil && now >= lockedUntil) setError(''); }, [locked]); // unlock clears message

  async function onVerify() {
    setLoading(true);
    const res = await api.verifyCode({ email, code });
    setLoading(false);
    if (res.ok) {
      await signIn(res, true);
      return router.replace('/home');
    }
    setError(res.message);
    if (res.locked) setLockedUntil(res.lockedUntil);
    setCode('');
  }

  async function onResend() {
    await api.resendCode({ email });
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    setError('');
  }

  return (
    <Screen title="Security Setup" subtitle={`We sent a ${CODE_LENGTH}-digit code to your email account.`}>
      <CodeInput value={code} onChange={(t) => { setCode(t); if (!locked) setError(''); }} error={!!error} disabled={locked} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Text>
        Didn't receive code?{' '}
        {secondsLeft > 0 ? `Resend in ${mmss(secondsLeft)}` : null}
      </Text>
      {secondsLeft === 0 ? <LinkText onPress={onResend}>Resend code</LinkText> : null}
      <Text>Check your spam folder if missing</Text>
      <Button title="Verify Code" onPress={onVerify} loading={loading} disabled={code.length !== CODE_LENGTH || locked} />
    </Screen>
  );
}
