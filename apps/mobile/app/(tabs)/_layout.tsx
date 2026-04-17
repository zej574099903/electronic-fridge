import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundContainer}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} color={color} size={22} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: '库存',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cube' : 'cube-outline'} color={color} size={22} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="intake"
        options={{
          title: '入库',
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '动态',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'pulse' : 'pulse-outline'} color={color} size={22} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} size={22} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, size }: { name: keyof typeof Ionicons.glyphMap; color: string; size: number; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

function CenterTabButton({ accessibilityState, onPress, onLongPress, style }: BottomTabBarButtonProps) {
  const focused = Boolean(accessibilityState?.selected);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[style, styles.centerButtonWrap]}
    >
      <View style={styles.centerButtonHalo}>
        {focused && (
          <LinearGradient
            colors={['rgba(31, 122, 140, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
        <Ionicons name="camera" size={24} color="#FFF" />
      </View>
      <Text style={[styles.centerLabel, focused && styles.centerLabelActive]}>入库</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === 'ios' ? 88 : 70,
    backgroundColor: 'transparent',
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tabBarBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  label: {
    fontSize: 10,
    fontFamily: typography.bodyBold,
    marginBottom: 6,
  },
  item: {
    height: 64,
    justifyContent: 'center',
    paddingTop: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  centerButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
  },
  centerButtonHalo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    ...shadows.soft,
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
    ...shadows.card,
  },
  centerButtonActive: {
    backgroundColor: colors.primary,
  },
  centerLabel: {
    marginTop: 8,
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: typography.bodyBold,
  },
  centerLabelActive: {
    color: colors.primaryDeep,
  },
});
