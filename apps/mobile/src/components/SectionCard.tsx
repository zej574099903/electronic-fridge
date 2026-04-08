import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/src/constants/colors';

interface SectionCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function SectionCard({ children, style }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,       // More rounded for premium feel
    padding: 20,           // More breathable padding
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)', // Glassy border hint
    gap: 16,
    // Premium Shadow (iOS)
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    // Premium Shadow (Android)
    elevation: 4,
  },
});
