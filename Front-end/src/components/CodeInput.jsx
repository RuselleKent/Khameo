import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CODE_LENGTH } from '../constants/config';

// 6 na kahon para sa code. Iisang hidden na input ang nasa likod nila,
// kaya gumagana ang paste at ang autofill galing sa email/SMS.
export default function CodeInput({ value, onChange, error, disabled }) {
    const inputRef = useRef(null);

    return (
        <Pressable onPress={() => inputRef.current?.focus()}>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                    <View
                        key={index}
                        style={{
                            width: 44,
                            height: 56,
                            borderWidth: 1,
                            borderRadius: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderColor: error ? 'red' : value.length === index ? '#000' : '#999',
                        }}
                    >
                        <Text style={{ fontSize: 22 }}>{value[index] || ''}</Text>
                    </View>
                ))}
            </View>
            <TextInput
                ref={inputRef}
                value={value}
                // Numbers lang, at hanggang 6 digits lang
                onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
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
