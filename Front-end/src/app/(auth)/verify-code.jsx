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

// 75 seconds -> "01:15"
const formatTime = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
};

export default function VerifyCode() {
    const router = useRouter();
    const { email } = useLocalSearchParams(); // galing sa register o login screen
    const { signIn } = useAuth();

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS); // countdown ng Resend
    const [lockedUntil, setLockedUntil] = useState(0); // oras (ms) kung kailan matatapos ang lock
    const [now, setNow] = useState(Date.now());

    // Isang orasan na tumatakbo bawat segundo: para sa Resend countdown at sa lock
    useEffect(() => {
        const id = setInterval(() => {
            setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 0));
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const locked = now < lockedUntil;

    // Kapag natapos na ang lock, burahin ang error message
    useEffect(() => {
        if (lockedUntil && now >= lockedUntil) setError('');
    }, [locked]);

    // Pinindot ang "Verify Code". Si Laravel ang nagche-check kung tama ang code.
    async function onVerify() {
        setLoading(true);
        const res = await api.verifyCode({ email, code });
        setLoading(false);

        if (res.ok) {
            await signIn(res, true); // verified na, kaya login na rin agad
            return router.replace('/home');
        }

        setError(res.message);
        if (res.locked) setLockedUntil(res.lockedUntil);
        setCode('');
    }

    // Pinindot ang "Resend code"
    async function onResend() {
        const res = await api.resendCode({ email });
        if (!res.ok) return setError(res.message);

        setSecondsLeft(RESEND_SECONDS);
        setCode('');
        setError('');
    }

    return (
        <Screen
            title="Security Setup"
            subtitle={`We sent a ${CODE_LENGTH}-digit code to your email account.`}
        >
            <CodeInput
                value={code}
                onChange={(text) => {
                    setCode(text);
                    if (!locked) setError('');
                }}
                error={!!error}
                disabled={locked}
            />
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
            <Text>
                Didn't receive code? {secondsLeft > 0 ? `Resend in ${formatTime(secondsLeft)}` : null}
            </Text>
            {secondsLeft === 0 ? <LinkText onPress={onResend}>Resend code</LinkText> : null}
            <Text>Check your spam folder if missing</Text>
            <Button
                title="Verify Code"
                onPress={onVerify}
                loading={loading}
                disabled={code.length !== CODE_LENGTH || locked}
            />
        </Screen>
    );
}
