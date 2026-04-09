import { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/colors';

interface Props extends PropsWithChildren {
  edges?: Edge[];
  style?: ViewStyle;
}

export function ScreenContainer({ children, edges = ['top', 'left', 'right'], style }: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
