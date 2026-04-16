import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/constants/colors';

export function AppBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#E6F0F5', '#F3F7FB', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.topOrb]} />
      <View style={[styles.orb, styles.bottomOrb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(31, 122, 140, 0.06)',
  },
  topOrb: {
    width: 320,
    height: 320,
    top: -100,
    right: -100,
  },
  bottomOrb: {
    width: 280,
    height: 280,
    bottom: 50,
    left: -120,
    opacity: 0.5,
  },
});
