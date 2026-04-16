import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { AppBackdrop } from '@/src/components/AppBackdrop';
import { colors } from '@/src/constants/colors';

interface Props extends PropsWithChildren {
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, edges = ['top', 'left', 'right'], style }: Props) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <AppBackdrop />
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
