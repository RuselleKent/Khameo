import { Pressable, Text } from 'react-native';

export default function LinkText({ children, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={{ textDecorationLine: 'underline' }}>{children}</Text>
    </Pressable>
  );
}
