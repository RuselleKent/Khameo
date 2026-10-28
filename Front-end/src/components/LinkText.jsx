import { Pressable, Text } from 'react-native';

// Text na may guhit sa ilalim, napipindot (parang link)
export default function LinkText({ children, onPress }) {
    return (
        <Pressable onPress={onPress}>
            <Text style={{ textDecorationLine: 'underline' }}>{children}</Text>
        </Pressable>
    );
}
