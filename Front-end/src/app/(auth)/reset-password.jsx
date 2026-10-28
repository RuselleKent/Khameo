import { useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import * as api from '../../services/auth';
import { validateEmail, validatePassword, validateConfirm } from '../../utils/validators';

export default function ResetPassword() {
    const router = useRouter();

    // Kapag galing sa link ng email, may laman na ang email at token.
    // Kapag galing sa "I have my reset code", ita-type ng user.
    const params = useLocalSearchParams();
    const [email, setEmail] = useState(params.email ? String(params.email) : '');
    const [token, setToken] = useState(params.token ? String(params.token) : '');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    // Pinindot ang "Update Password"
    async function onUpdate() {
        const newErrors = {
            email: validateEmail(email),
            token: token.trim() ? '' : 'Reset code is required.',
            password: validatePassword(password),
            confirm: validateConfirm(password, confirm),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return;

        // Si Laravel ang magche-check kung valid pa ang reset code
        setLoading(true);
        const res = await api.resetPassword({ token: token.trim(), email, password, confirm });
        setLoading(false);

        if (!res.ok) {
            // Walang field ang "invalid or expired", kaya sa reset code natin ilalagay
            const field = ['password', 'confirm', 'email'].includes(res.field) ? res.field : 'token';
            return setErrors({ [field]: res.message });
        }
        setDone(true);
    }

    if (done) {
        return (
            <Screen title="Password Reset" subtitle="Your password has been updated successfully.">
                <Text>You can now sign in with your new password.</Text>
                <Button title="Back to Sign In" onPress={() => router.replace('/login')} />
            </Screen>
        );
    }

    return (
        <Screen title="Reset Password" subtitle="Create a new password for your account.">
            <Field
                label="Email Address"
                placeholder="ex. khameo@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                error={errors.email}
            />
            <Field
                label="Reset Code"
                placeholder="Paste the code from your email"
                value={token}
                onChangeText={setToken}
                error={errors.token}
            />
            <Field
                label="New Password"
                placeholder="Enter your new password"
                secure
                value={password}
                onChangeText={setPassword}
                error={errors.password}
            />
            <Field
                label="Confirm Password"
                placeholder="Confirm your new password"
                secure
                value={confirm}
                onChangeText={setConfirm}
                error={errors.confirm}
            />
            <Button title="Update Password" onPress={onUpdate} loading={loading} />
        </Screen>
    );
}
