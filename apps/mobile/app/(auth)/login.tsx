import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { useAuthStore } from '@/src/store/useAuthStore';
import { authApi } from '@/src/lib/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [clearError, countdown]);

  async function handleSendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('输入有误', '请输入正确的手机号码');
      return;
    }

    setIsSendingCode(true);
    try {
      await authApi.sendCode(phone);
      setCountdown(60);
      Alert.alert('验证码已发送', '开发阶段验证码固定为 123456');
    } catch {
      Alert.alert('发送失败', '请稍后再试');
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleLogin() {
    if (!phone || !code) {
      Alert.alert('提示', '请完整填写手机号和验证码');
      return;
    }

    const success = await login(phone, code);
    if (success) {
      router.replace('/(tabs)');
    }
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topGlow} />

          <View style={styles.header}>
            <Text style={styles.kicker}>FRIDGE</Text>
            <Text style={styles.title}>把库存看清楚</Text>
            <Text style={styles.subtitle}>用手机号进入你的冰箱记录。</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.logoIcon}>
                <Ionicons name="snow-outline" size={26} color={colors.primaryDeep} />
              </View>
              <View style={styles.panelHeaderText}>
                <Text style={styles.panelTitle}>手机号登录</Text>
                <Text style={styles.panelSubtitle}>开发环境验证码固定为 123456</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>手机号</Text>
              <View style={styles.inputShell}>
                <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="请输入手机号"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={11}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>验证码</Text>
              <View style={styles.inputShell}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="请输入 6 位验证码"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                />
                <Pressable onPress={() => void handleSendCode()} disabled={countdown > 0 || isSendingCode} style={[styles.codeButton, (countdown > 0 || isSendingCode) && styles.codeButtonDisabled]}>
                  <Text style={styles.codeButtonText}>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
                </Pressable>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable onPress={() => void handleLogin()} disabled={isLoading} style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}>
              <Text style={styles.loginButtonText}>{isLoading ? '登录中...' : '进入冰箱'}</Text>
            </Pressable>

            <View style={styles.footnoteRow}>
              <Ionicons name="wifi-outline" size={16} color={colors.primary} />
              <Text style={styles.footnoteText}>Expo Go 预览时，手机与电脑保持同一网络会更稳定。</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 24,
    paddingBottom: 40,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: -130,
    right: -70,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.12)',
  },
  header: {
    gap: 6,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.6,
    fontFamily: typography.bodyBold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 38,
    lineHeight: 46,
    fontFamily: typography.displayHeavy,
    maxWidth: 260,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.bodyMedium,
    maxWidth: 260,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  panelHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  logoIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.chilled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelHeaderText: {
    flex: 1,
    gap: 4,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.displayBold,
  },
  panelSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.bodyMedium,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.bodyMedium,
  },
  codeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
  },
  codeButtonDisabled: {
    opacity: 0.55,
  },
  codeButtonText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  loginButton: {
    minHeight: 52,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonText: {
    color: colors.textOnDark,
    fontSize: 15,
    fontFamily: typography.bodyBold,
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footnoteText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.bodyMedium,
  },
});
