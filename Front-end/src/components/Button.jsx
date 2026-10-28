import { ActivityIndicator, Pressable, Text } from 'react-native';

// Simpleng button. Kapag loading o disabled, hindi ito napipindot.
export default function Button({ title, onPress, disabled, loading }) {
    const off = disabled || loading;

    return (
        <Pressable
            onPress={off ? undefined : onPress}
            style={{
                padding: 14,
                borderWidth: 1,
                borderRadius: 6,
                alignItems: 'center',
                opacity: off ? 0.4 : 1,
            }}
        >
            {loading ? <ActivityIndicator /> : <Text>{title}</Text>}
        </Pressable>
    );
}
