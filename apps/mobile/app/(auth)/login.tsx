import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
    Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/store/useAuthStore';
import { authApi } from '@/src/lib/api';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const { login, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        // Clear any previous error messages when the screen mounts
        clearError();

        let timer: any;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendCode = async () => {
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            Alert.alert('输入有误', '请输入正确的手机号码');
            return;
        }

        setIsSendingCode(true);
        try {
            await authApi.sendCode(phone);
            setCountdown(60);
            Alert.alert('提示', '验证码已发送 (开发阶段请使用 123456)');
        } catch (err) {
            Alert.alert('发送失败', '请稍后再试');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleLogin = async () => {
        if (!phone || !code) {
            Alert.alert('提示', '请完整填写手机号和验证码');
            return;
        }

        const success = await login(phone, code);
        if (success) {
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="snow" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>Arctic Fresh</Text>
                        <Text style={styles.subtitle}>智能管理您的电子冰箱</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>手机号码</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="请输入手机号"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>验证码</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="请输入6位验证码"
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    placeholderTextColor={colors.textMuted}
                                />
                                <Pressable
                                    onPress={handleSendCode}
                                    disabled={countdown > 0 || isSendingCode}
                                    style={({ pressed }) => [
                                        styles.codeButton,
                                        (countdown > 0 || isSendingCode || pressed) && styles.codeButtonDisabled
                                    ]}
                                >
                                    <Text style={styles.codeButtonText}>
                                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable
                            onPress={handleLogin}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                styles.loginButton,
                                (isLoading || pressed) && styles.loginButtonDisabled
                            ]}
                        >
                            <Text style={styles.loginButtonText}>{isLoading ? '登录中...' : '立即登录'}</Text>
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>其他登录方式</Text>
                        <View style={styles.socialRow}>
                            <Pressable style={({ pressed }) => [styles.socialIcon, pressed && { opacity: 0.6 }]}>
                                <Ionicons name="logo-wechat" size={24} color="#07C160" />
                            </Pressable>
                            <Pressable style={({ pressed }) => [styles.socialIcon, pressed && { opacity: 0.6 }]}>
                                <Ionicons name="logo-apple" size={24} color="#000000" />
                            </Pressable>
                            <Pressable style={({ pressed }) => [styles.socialIcon, pressed && { opacity: 0.6 }]}>
                                <Ionicons name="logo-google" size={24} color="#EA4335" />
                            </Pressable>
                        </View>
                        <Text style={styles.agreementText}>
                            登录即代表您同意 <Text style={styles.link}>用户协议</Text> 和 <Text style={styles.link}>隐私政策</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
        gap: 40,
    },
    header: {
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: 16,
        height: 64,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    codeButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    codeButtonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.8,
    },
    codeButtonText: {
        color: colors.surface,
        fontSize: 13,
        fontWeight: '700',
    },
    loginButton: {
        backgroundColor: colors.primary,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: colors.surface,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    errorText: {
        color: colors.danger,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        gap: 24,
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '600',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 24,
    },
    socialIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    agreementText: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: colors.secondary,
        fontWeight: '700',
    },
});
