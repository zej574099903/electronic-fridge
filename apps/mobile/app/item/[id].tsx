import { useEffect, useMemo, useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { formatStorageSpaceLabel, getDaysUntilExpiration } from '@/src/lib/expiry';
import { CreateFridgeItemInput, useInventoryStore } from '@/src/store/useInventoryStore';
import { ItemCategory, ItemStatus, StorageSpace } from '@/src/types/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const statusLabelMap = {
  active: '库存中',
  eaten: '已吃掉',
  discarded: '已丢弃',
  expired: '已过期',
} as const;

const categoryLabelMap: Record<ItemCategory, string> = {
  ingredient: '食材',
  fruit: '水果',
  drink: '饮品',
  dessert: '甜品',
  snack: '零食',
  leftover: '剩菜',
  prepared: '熟食',
  other: '其他',
};

const quickAddCategoryOptions: Array<{ label: string; value: ItemCategory }> = [
  { label: '食材', value: 'ingredient' },
  { label: '水果', value: 'fruit' },
  { label: '饮品', value: 'drink' },
  { label: '甜品', value: 'dessert' },
  { label: '零食', value: 'snack' },
  { label: '剩菜', value: 'leftover' },
  { label: '熟食', value: 'prepared' },
  { label: '其他', value: 'other' },
];

const quickAddStorageOptions: Array<{ label: string; value: StorageSpace }> = [
  { label: '冷藏', value: 'chilled' },
  { label: '冷冻', value: 'frozen' },
  { label: '其他', value: 'other' },
];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const clearError = useInventoryStore((state) => state.clearError);
  const item = useMemo(() => items.find((currentItem) => currentItem.id === id), [id, items]);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<CreateFridgeItemInput>({
    name: '',
    category: 'ingredient',
    storageSpace: 'chilled',
    expiresOn: '',
    quantity: undefined,
    quantityUnit: '',
    note: '',
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!initialized) void fetchItems();
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (!item) return;
    setEditDraft({
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace ?? 'chilled',
      expiresOn: item.expiresOn ? item.expiresOn.slice(0, 10) : '',
      quantity: item.quantity,
      quantityUnit: item.quantityUnit ?? '',
      note: item.note ?? '',
    });
  }, [item]);

  function updateEditDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setEditDraft((current) => ({ ...current, [key]: value }));
  }

  function resetEditDraft() {
    if (!item) return;
    setEditDraft({
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace ?? 'chilled',
      expiresOn: item.expiresOn ? item.expiresOn.slice(0, 10) : '',
      quantity: item.quantity,
      quantityUnit: item.quantityUnit ?? '',
      note: item.note ?? '',
    });
  }

  function handleStatusUpdate(status: ItemStatus) {
    if (!item) return;
    const actionText = statusLabelMap[status];
    Alert.alert('更新库存状态', `确定将「${item.name}」标记为${actionText}吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          clearError();
          setEditError('');
          try {
            await updateItemStatus(item.id, status);
            setFeedbackMessage(`已更新状态：${actionText}`);
          } catch {
            setEditError('更新失败，请稍后再试');
          }
        },
      },
    ]);
  }

  async function handleSaveEdit() {
    if (!item) return;
    if (editDraft.name.trim().length === 0) {
      setEditError('请先填写物品名称');
      return;
    }
    clearError();
    setEditError('');
    try {
      await updateItem(item.id, {
        ...editDraft,
        quantity: editDraft.quantity && editDraft.quantity > 0 ? editDraft.quantity : undefined,
      });
      setFeedbackMessage('详情已更新');
      setIsEditing(false);
    } catch {
      setEditError('保存失败，请稍后再试');
    }
  }

  function handleDeleteItem() {
    if (!item) return;
    Alert.alert('确认删除', `确定要删除「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          clearError();
          try {
            await removeItem(item.id);
            router.replace('/(tabs)/inventory');
          } catch {
            setEditError('删除失败，请稍后再试');
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <BlurView intensity={20} tint="light" style={styles.backBlur}>
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </BlurView>
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.kicker}>ITEM DETAILS</Text>
            <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
              {item?.name ?? '食材详情'}
            </GradientText>
          </View>
        </View>

        {!item ? (
          <View style={styles.cardWrapper}>
             <Text style={styles.emptyText}>未找到该物品</Text>
          </View>
        ) : (
          <>
            <HeroDecisionCard
              itemName={item.name}
              photoUri={item.photoUri}
              status={item.status}
              expireOn={item.expiresOn}
              daysUntilExpiration={getDaysUntilExpiration(item)}
              storageSpace={item.storageSpace}
            />

            {feedbackMessage ? <FeedbackBanner tone="success" text={feedbackMessage} /> : null}
            {editError ? <FeedbackBanner tone="error" text={editError} /> : null}

            {/* Actions Section */}
            <View style={styles.cardWrapper}>
              <View style={styles.cardBorder}>
                <View style={styles.glassCard}>
                  <View style={styles.sectionTop}>
                    <Text style={styles.sectionTitle}>操作中心</Text>
                  </View>

                  {item.status === 'active' ? (
                    <View style={styles.actionGrid}>
                      <PrimaryAction 
                        label="吃掉" 
                        icon="restaurant-outline" 
                        color={colors.success} 
                        onPress={() => handleStatusUpdate('eaten')} 
                      />
                      <PrimaryAction 
                        label="丢弃" 
                        icon="trash-outline" 
                        color={colors.danger} 
                        onPress={() => handleStatusUpdate('discarded')} 
                      />
                    </View>
                  ) : (
                    <PrimaryAction 
                      label="恢复到库" 
                      icon="refresh-outline" 
                      color={colors.info} 
                      onPress={() => handleStatusUpdate('active')} 
                    />
                  )}
                  
                  <View style={styles.miniActionRow}>
                    <SecondaryAction label="设为过期" icon="alert-circle" color={colors.warning} onPress={() => handleStatusUpdate('expired')} />
                    <View style={styles.vDivider} />
                    <SecondaryAction label="删除记录" icon="close" color={colors.textSecondary} onPress={handleDeleteItem} />
                  </View>
                </View>
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.cardWrapper}>
              <View style={styles.cardBorder}>
                <View style={styles.glassCard}>
                  <View style={styles.sectionTop}>
                    <Text style={styles.sectionTitle}>详细配置</Text>
                    <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>{isEditing ? '取消' : '编辑'}</Text>
                    </Pressable>
                  </View>

                  {isEditing ? (
                    <View style={styles.editPanel}>
                      <TextInput 
                        style={styles.input} 
                        value={editDraft.name} 
                        onChangeText={v => updateEditDraft('name', v)}
                        placeholder="名称"
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {quickAddCategoryOptions.map(o => (
                          <Pressable 
                            key={o.value} 
                            onPress={() => updateEditDraft('category', o.value)}
                            style={[styles.chip, editDraft.category === o.value && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, editDraft.category === o.value && styles.chipTextActive]}>{o.label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                      <View style={styles.saveBlock}>
                        <Pressable onPress={() => void handleSaveEdit()} style={styles.saveBtn}>
                          <Text style={styles.saveBtnText}>保存修改</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.infoGrid}>
                      <InfoItem label="形态" value={categoryLabelMap[item.category]} icon="apps-outline" />
                      <InfoItem label="位置" value={formatStorageSpaceLabel(item.storageSpace)} icon="location-outline" />
                      <InfoItem label="存量" value={item.quantity ? `${item.quantity}${item.quantityUnit ?? ''}` : '未计'} icon="layers-outline" />
                      <InfoItem label="备注" value={item.note || '无备注'} icon="document-text-outline" full />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function HeroDecisionCard({ itemName, photoUri, status, expireOn, daysUntilExpiration, storageSpace }: any) {
  const decision = getDecisionState(status, daysUntilExpiration);
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardBorder}>
        <View style={[styles.heroCard, { backgroundColor: decision.backgroundColor }]}>
          <View style={styles.heroTop}>
             <View style={styles.heroImageContainer}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroFallback}>
                    <Ionicons name="fast-food-outline" size={40} color={colors.textMuted} />
                  </View>
                )}
             </View>
             <View style={styles.heroInfo}>
                <Text style={styles.heroEyebrow}>CURRENT STATUS</Text>
                <Text style={styles.heroDecisionTitle} style={{ color: decision.color }}>{decision.title}</Text>
                <Text style={styles.heroDesc}>{decision.description}</Text>
             </View>
          </View>
          
          <BlurView intensity={20} tint="light" style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Ionicons name="calendar-clear-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.heroMetricText}>{expireOn?.slice(0, 10) || '未设定'}</Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.heroMetric}>
              <Ionicons name="snow-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.heroMetricText}>{formatStorageSpaceLabel(storageSpace)}</Text>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

function PrimaryAction({ label, icon, color, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={styles.pAction}>
      <View style={[styles.pActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.pActionText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryAction({ label, icon, color, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={styles.sAction}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.sActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function InfoItem({ label, value, icon, full }: any) {
  return (
    <View style={[styles.infoItem, full && styles.infoItemFull]}>
      <View style={styles.infoItemInner}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={15} color={colors.primary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
          <Text style={styles.infoValue} numberOfLines={full ? 0 : 1}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

function FeedbackBanner({ tone, text }: any) {
  return (
    <View style={[styles.feedback, tone === 'success' ? styles.fbSuccess : styles.fbError]}>
      <Text style={[styles.fbText, tone === 'success' ? styles.ftSuccess : styles.ftError]}>{text}</Text>
    </View>
  );
}

function getDecisionState(status: ItemStatus, daysUntilExpiration: number | null) {
  if (status === 'eaten') return { title: '已销库', description: '这件食材已被享用', color: colors.success, backgroundColor: 'rgba(52, 211, 153, 0.08)', icon: 'checkmark-circle' };
  if (status === 'discarded') return { title: '已丢弃', description: '记录已从库存中移除', color: colors.danger, backgroundColor: 'rgba(248, 113, 113, 0.08)', icon: 'trash' };
  if (daysUntilExpiration === null) return { title: '待补档', description: '补填日期以实现精准提醒', color: colors.info, backgroundColor: 'rgba(56, 189, 248, 0.08)', icon: 'time' };
  if (daysUntilExpiration <= 0) return { title: '已过期', description: '请尽快清理或确认状态', color: colors.danger, backgroundColor: 'rgba(248, 113, 113, 0.08)', icon: 'alert' };
  if (daysUntilExpiration <= 1) return { title: '核心预警', description: '建议今日优先处理', color: colors.danger, backgroundColor: 'rgba(218, 106, 94, 0.1)', icon: 'flash' };
  return { title: `存量稳健`, description: `还能锁鲜约 ${daysUntilExpiration} 天`, color: colors.primaryDeep, backgroundColor: 'rgba(31, 122, 140, 0.08)', icon: 'leaf' };
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  backBtn: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  backBlur: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  headerTitleGroup: { gap: 2 },
  kicker: { color: colors.primary, fontSize: 10, fontFamily: typography.bodyBold, letterSpacing: 2 },
  title: { color: colors.textPrimary, fontSize: 28, fontFamily: typography.displayBold, letterSpacing: -0.5 },
  cardWrapper: { ...shadows.card },
  cardBorder: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  glassCard: { padding: 20, backgroundColor: 'rgba(255,255,255,0.4)', gap: 20 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: typography.displayBold, color: colors.textPrimary },
  heroCard: { padding: 20, gap: 20 },
  heroTop: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  heroImageContainer: { width: 100, height: 100, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF', ...shadows.soft },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  heroInfo: { flex: 1, gap: 4 },
  heroEyebrow: { fontSize: 8, fontFamily: typography.bodyBold, color: colors.textMuted, letterSpacing: 1 },
  heroDecisionTitle: { fontSize: 32, fontFamily: typography.displayBold },
  heroDesc: { fontSize: 13, fontFamily: typography.bodyMedium, color: colors.textSecondary, opacity: 0.8 },
  heroMetrics: { flexDirection: 'row', padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroMetric: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroMetricText: { fontSize: 13, fontFamily: typography.bodyBold, color: colors.textSecondary },
  vDivider: { width: 1, height: 14, backgroundColor: 'rgba(0,0,0,0.05)' },
  actionGrid: { flexDirection: 'row', gap: 12 },
  pAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: '#FFF', ...shadows.soft },
  pActionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pActionText: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textPrimary },
  miniActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 16, padding: 4 },
  sAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  sActionText: { fontSize: 12, fontFamily: typography.bodyBold },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { width: '48%' },
  infoItemFull: { width: '100%' },
  infoItemInner: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 64,
  },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 8, fontFamily: typography.bodyBold, color: colors.textMuted, letterSpacing: 1 },
  infoValue: { fontSize: 13, fontFamily: typography.bodyBold, color: colors.textPrimary },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(31, 122, 140, 0.1)' },
  editBtnText: { fontSize: 12, fontFamily: typography.bodyBold, color: colors.primaryDeep },
  editPanel: { gap: 12 },
  input: { height: 48, borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 16, fontFamily: typography.bodyBold, fontSize: 15 },
  chipScroll: { marginHorizontal: -4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  chipActive: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontSize: 12, fontFamily: typography.bodyBold, color: colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  saveBlock: { marginTop: 8 },
  saveBtn: { height: 48, borderRadius: 24, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  saveBtnText: { color: '#FFF', fontSize: 15, fontFamily: typography.bodyBold },
  feedback: { padding: 12, borderRadius: 12 },
  fbSuccess: { backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  fbError: { backgroundColor: 'rgba(248, 113, 113, 0.1)' },
  fbText: { fontSize: 13, fontFamily: typography.bodyMedium, textAlign: 'center' },
  ftSuccess: { color: colors.success },
  ftError: { color: colors.danger },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 14, fontFamily: typography.bodyMedium, padding: 40 },
});
