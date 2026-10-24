import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

export default function Field({ label, error, secure, ...props }) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={{ gap: 4 }}>
      <Text>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: error ? 'red' : '#999', borderRadius: 6 }}>
        <TextInput
          style={{ flex: 1, padding: 10 }}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} style={{ padding: 10 }} accessibilityLabel="Show or hide password">
            <Text>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
    </View>
  );
}
