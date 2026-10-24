import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CODE_LENGTH } from '../constants/config';

// 6 boxes, one hidden input behind them. Works with paste and SMS/email autofill.
export default function CodeInput({ value, onChange, error, disabled }) {
  const ref = useRef(null);
  return (
    <Pressable onPress={() => ref.current?.focus()}>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={{ width: 44, height: 56, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderColor: error ? 'red' : value.length === i ? '#000' : '#999' }}
          >
            <Text style={{ fontSize: 22 }}>{value[i] || ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        editable={!disabled}
        autoFocus
        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%' }}
      />
    </Pressable>
  );
}
