import { ScrollView, Text, View } from 'react-native';

// Plain page wrapper. Put your design (colors, spacing, fonts) here later.
export default function Screen({ title, subtitle, children }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 26, fontWeight: '700' }}>{title}</Text>
      {subtitle ? <Text>{subtitle}</Text> : null}
      <View style={{ gap: 12 }}>{children}</View>
    </ScrollView>
  );
}
