import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/constants/colors';

export function AppBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.gradient.pageTop, colors.gradient.pageBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.topOrb]} />
      <View style={[styles.orb, styles.bottomOrb]} />
      <View style={styles.grid} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.glow,
  },
  topOrb: {
    width: 260,
    height: 260,
    top: -90,
    right: -40,
  },
  bottomOrb: {
    width: 220,
    height: 220,
    bottom: 120,
    left: -70,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
