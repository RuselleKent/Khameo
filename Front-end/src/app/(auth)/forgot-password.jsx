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
    const [sent, setSent] = useState(false); // naipadala na ba ang email?

    // Pinindot ang "Send Reset Link"
    async function onSend() {
        const message = validateEmail(email);
        setError(message);
        if (message) return;

        // Si Laravel ang magpapadala ng email na may reset link at reset code
        setLoading(true);
        const res = await api.forgotPassword({ email });
        setLoading(false);

        if (!res.ok) return setError(res.message);
        setSent(true);
    }

    return (
        <Screen title="Forgot Password?" subtitle="Enter your email to receive a reset link.">
            <Field
                label="Email Address"
                placeholder="ex. khameo@gmail.com"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setSent(false);
                }}
                keyboardType="email-address"
                error={error}
            />
            {sent ? <Text>Reset email sent to {email.trim()}. Check your inbox.</Text> : null}
            <Button
                title={sent ? 'Resend Reset Link' : 'Send Reset Link'}
                onPress={onSend}
                loading={loading}
            />
            {/* Sa Expo Go, hindi nabubuksan ng link sa email ang app.
                Kaya may reset code sa email na ilalagay dito. */}
            {sent ? (
                <LinkText
                    onPress={() =>
                        router.push({ pathname: '/reset-password', params: { email: email.trim() } })
                    }
                >
                    I have my reset code
                </LinkText>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text>Remember your password?</Text>
                <LinkText onPress={() => router.replace('/login')}>Sign In</LinkText>
            </View>
        </Screen>
    );
}
