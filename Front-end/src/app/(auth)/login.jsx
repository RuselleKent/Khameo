import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import LinkText from '../../components/LinkText';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/auth';
import { validateEmail } from '../../utils/validators';

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();

    // Mga laman ng form at estado ng screen
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Pinindot ang "Login"
    async function onLogin() {
        // 1. Mabilis na check sa phone muna (para hindi na tumawag sa server kung kulang)
        const newErrors = {
            email: validateEmail(email),
            password: password ? '' : 'Password is required.',
        };
        setErrors(newErrors);
        if (newErrors.email || newErrors.password) return;

        // 2. Tawagan ang Laravel. Siya ang magche-check ng email at password.
        setLoading(true);
        const res = await api.login({ email, password, remember });
        setLoading(false);

        // 3. Hindi pa verified ang email: dalhin sa verify screen
        if (res.needsVerification) {
            return router.push({
                pathname: '/verify-code',
                params: { email: res.email || email.trim() },
            });
        }

        // 4. May mali: ipakita sa ilalim ng tamang input
        if (!res.ok) {
            return setErrors({ [res.field || 'email']: res.message });
        }

        // 5. Success: i-save ang token at pumunta sa home
        await signIn(res, remember);
        router.replace('/home');
    }

    // Pinindot ang "Google Account"
    async function onGoogle() {
        setLoading(true);
        const res = await api.googleSignIn();
        setLoading(false);

        if (!res.ok) return setErrors({ email: res.message });
        if (res.linked) router.push('/account-connected');
    }

    return (
        <Screen title="Welcome Back" subtitle="Sign in to continue">
            <Field
                label="Email Address"
                placeholder="ex. khameo@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                error={errors.email}
            />
            <Field
                label="Password"
                placeholder="Enter your password"
                secure
                value={password}
                onChangeText={setPassword}
                error={errors.password}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable onPress={() => setRemember((value) => !value)}>
                    <Text>{remember ? '[x]' : '[ ]'} Remember me</Text>
                </Pressable>
                <LinkText onPress={() => router.push('/forgot-password')}>Forgot Password?</LinkText>
            </View>
            <Button title="Login" onPress={onLogin} loading={loading} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text>Don't have an account?</Text>
                <LinkText onPress={() => router.push('/register')}>Register</LinkText>
            </View>
            <Text>Or sign in with</Text>
            <Button title="Google Account" onPress={onGoogle} disabled={loading} />
        </Screen>
    );
}
