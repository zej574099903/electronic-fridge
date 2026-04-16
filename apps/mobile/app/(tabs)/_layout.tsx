import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDeep,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: '库存',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={size} color={color} />
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
          title: '提醒',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
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
      <View style={[styles.centerButtonHalo, focused && styles.centerButtonHaloActive]} />
      <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
        <Ionicons name={focused ? 'camera' : 'camera-outline'} size={22} color={colors.textOnDark} />
      </View>
      <Text style={[styles.centerLabel, focused && styles.centerLabelActive]}>入库</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: Platform.OS === 'ios' ? 88 : 74,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 0,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    overflow: 'visible',
    ...shadows.card,
  },
  label: {
    fontSize: 11,
    fontFamily: typography.bodyBold,
    marginTop: 2,
  },
  item: {
    borderRadius: radii.md,
    marginVertical: 4,
  },
  centerButtonWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -22,
  },
  centerButtonHalo: {
    position: 'absolute',
    top: 5,
    width: 74,
    height: 74,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.12)',
  },
  centerButtonHaloActive: {
    backgroundColor: 'rgba(111,214,255,0.18)',
  },
  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
    ...shadows.soft,
  },
  centerButtonActive: {
    backgroundColor: colors.primary,
  },
  centerLabel: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: typography.bodyBold,
  },
  centerLabelActive: {
    color: colors.primaryDeep,
  },
});
