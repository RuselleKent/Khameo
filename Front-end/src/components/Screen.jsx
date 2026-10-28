import { ScrollView, Text, View } from 'react-native';

// Pangkalahatang balot ng bawat page. Dito ilalagay ang design (kulay, spacing, font) mamaya.
export default function Screen({ title, subtitle, children }) {
    return (
        <ScrollView
            contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={{ fontSize: 26, fontWeight: '700' }}>{title}</Text>
            {subtitle ? <Text>{subtitle}</Text> : null}
            <View style={{ gap: 12 }}>{children}</View>
        </ScrollView>
    );
}
