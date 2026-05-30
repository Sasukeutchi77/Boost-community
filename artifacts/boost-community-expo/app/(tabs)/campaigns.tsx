import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Modal, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useListCampaigns, useGetMyCampaigns, type Campaign } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';

const STATUS_COLORS: Record<string, string> = { pending: Colors.warning, active: Colors.success, paused: Colors.mutedForeground, completed: Colors.accent };
const STATUS_LABELS: Record<string, string> = { pending: 'En attente', active: 'Active', paused: 'Pausée', completed: 'Terminée' };
const TYPE_ICONS: Record<string, string> = { watch: 'eye', like: 'heart', comment: 'message-circle', follow: 'user-plus', share: 'share-2' };
const TYPES = ['watch', 'like', 'comment', 'follow', 'share'] as const;
type CampaignType = typeof TYPES[number];

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const type = (campaign as any).targetType as string;
  const status = (campaign as any).status as string;
  const color = Colors.missionType[type] ?? Colors.primary;
  const statusColor = STATUS_COLORS[status] ?? Colors.mutedForeground;
  const progress = (campaign as any).completedCount ?? 0;
  const total = (campaign as any).targetCount ?? 1;
  const pct = Math.min(100, (progress / total) * 100);
  return (
    <View style={[styles.card, { borderColor: `${color}20` }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${color}18` }]}>
          <Feather name={(TYPE_ICONS[type] ?? 'radio') as never} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{(campaign as any).title}</Text>
          <Text style={styles.cardType}>{type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[status] ?? status}</Text>
        </View>
      </View>
      {(campaign as any).targetUrl ? (
        <View style={styles.urlRow}><Feather name='link' size={12} color={Colors.accent} /><Text style={styles.urlText} numberOfLines={1}>{(campaign as any).targetUrl}</Text></View>
      ) : null}
      <View style={styles.cardStats}>
        <View style={styles.cardStat}><Feather name='users' size={13} color={Colors.mutedForeground} /><Text style={styles.cardStatText}>{progress}/{total}</Text></View>
        <View style={styles.cardStat}><Feather name='dollar-sign' size={13} color={Colors.yellow} /><Text style={styles.cardStatText}>{(campaign as any).coinsRequired} coins</Text></View>
      </View>
      <View style={[styles.progressBar, { marginTop: 8 }]}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CreateCampaignModal({ visible, onClose, onCreated, authToken }: { visible: boolean; onClose: () => void; onCreated: () => void; authToken: string | null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<CampaignType>('watch');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetCount, setTargetCount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const coinsRequired = Math.floor(Math.max(10, Math.min(Number(targetCount) || 100, 10000)) * 0.5);

  const handleCreate = async () => {
    if (!title.trim()) { setError('Titre requis'); return; }
    setError(''); setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, targetType, targetUrl: targetUrl.trim() || undefined, targetCount: Number(targetCount) || 100 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Erreur'); setLoading(false); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle(''); setDescription(''); setTargetUrl(''); setTargetCount('100'); setTargetType('watch');
      onCreated(); onClose();
    } catch { setError('Erreur réseau'); }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType='slide' presentationStyle='pageSheet' onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Feather name='x' size={20} color={Colors.foreground} /></TouchableOpacity>
          <Text style={styles.modalTitle}>Nouvelle campagne</Text>
          <TouchableOpacity style={[styles.submitBtn, (loading || !title.trim()) && { opacity: 0.5 }]} onPress={handleCreate} disabled={loading || !title.trim()}>
            {loading ? <ActivityIndicator size='small' color='#fff' /> : <Text style={styles.submitBtnText}>Lancer</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps='handled'>
          <Text style={styles.fieldLabel}>Titre *</Text>
          <TextInput style={styles.textInput} value={title} onChangeText={setTitle} placeholder='Ex: Like ma vidéo TikTok' placeholderTextColor={Colors.mutedForeground} maxLength={200} />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Description</Text>
          <TextInput style={[styles.textInput, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder='Détails optionnels...' placeholderTextColor={Colors.mutedForeground} multiline textAlignVertical='top' />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Type d action *</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t => {
              const active = targetType === t;
              const color = Colors.missionType[t] ?? Colors.primary;
              return (
                <TouchableOpacity key={t} style={[styles.typeBtn, active && { backgroundColor: `${color}20`, borderColor: `${color}50` }]} onPress={() => setTargetType(t)} activeOpacity={0.8}>
                  <Feather name={(TYPE_ICONS[t] ?? 'radio') as never} size={16} color={active ? color : Colors.mutedForeground} />
                  <Text style={[styles.typeBtnText, active && { color }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>URL cible</Text>
          <TextInput style={styles.textInput} value={targetUrl} onChangeText={setTargetUrl} placeholder='https://tiktok.com/@...' placeholderTextColor={Colors.mutedForeground} autoCapitalize='none' keyboardType='url' />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Nombre de participants</Text>
          <TextInput style={styles.textInput} value={targetCount} onChangeText={setTargetCount} keyboardType='number-pad' placeholder='100' placeholderTextColor={Colors.mutedForeground} />
          <View style={styles.costBox}>
            <Feather name='dollar-sign' size={16} color={Colors.yellow} />
            <Text style={styles.costText}>Coût : <Text style={{ color: Colors.yellow, fontFamily: 'Inter_700Bold' }}>{coinsRequired} coins</Text></Text>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Campaigns() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [showCreate, setShowCreate] = useState(false);
  const { data: available, isLoading: loadingAvail, refetch: refetchAvail } = useListCampaigns({ status: 'active' });
  const { data: mine, isLoading: loadingMine, refetch: refetchMine } = useGetMyCampaigns();
  const data = (tab === 'available' ? available : mine) as Campaign[] | undefined;
  const isLoading = tab === 'available' ? loadingAvail : loadingMine;
  const refetch = tab === 'available' ? refetchAvail : refetchMine;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <View><Text style={styles.headerTitle}>Campagnes</Text><Text style={styles.headerSub}>Lance et suis tes campagnes</Text></View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
            <Feather name='plus' size={18} color='#fff' />
          </TouchableOpacity>
        </View>
        <View style={styles.tabs}>
          {(['available', 'mine'] as const).map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)} activeOpacity={0.75}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'available' ? 'Disponibles' : 'Mes Campagnes'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {isLoading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={c => String((c as any).id)}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name='radio' size={40} color={Colors.mutedForeground} />
              <Text style={styles.emptyText}>{tab === 'available' ? 'Aucune campagne' : 'Aucune campagne créée'}</Text>
              {tab === 'mine' && <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreate(true)}><Feather name='plus' size={16} color='#fff' /><Text style={styles.emptyCreateText}>Créer une campagne</Text></TouchableOpacity>}
            </View>
          }
          renderItem={({ item }) => <CampaignCard campaign={item} />}
        />
      )}
      <CreateCampaignModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetchAvail(); refetchMine(); }} authToken={token} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.foreground, fontFamily: 'Inter_800ExtraBold', marginBottom: 2 },
  headerSub: { fontSize: 13, color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  createBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  tabBtnActive: { backgroundColor: `${Colors.primary}18`, borderColor: `${Colors.primary}40` },
  tabText: { fontSize: 13, color: Colors.mutedForeground, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground, fontFamily: 'Inter_600SemiBold' },
  cardType: { fontSize: 11, color: Colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  urlText: { flex: 1, fontSize: 11, color: Colors.accent, fontFamily: 'Inter_400Regular' },
  cardStats: { flexDirection: 'row', gap: 14 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: 12, color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  progressBar: { height: 4, backgroundColor: Colors.muted, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 99 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyCreateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: Colors.radius, marginTop: 4 },
  emptyCreateText: { color: '#fff', fontWeight: '600', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.foreground, fontFamily: 'Inter_700Bold' },
  submitBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  modalBody: { padding: 16, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.foreground, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  textInput: { backgroundColor: Colors.surface, borderRadius: Colors.radiusSm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, color: Colors.foreground, fontSize: 14, fontFamily: 'Inter_400Regular' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  typeBtnText: { fontSize: 13, color: Colors.mutedForeground, fontFamily: 'Inter_500Medium' },
  costBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 14, backgroundColor: `${Colors.yellow}10`, borderRadius: Colors.radiusSm, borderWidth: 1, borderColor: `${Colors.yellow}20` },
  costText: { fontSize: 13, color: Colors.foreground, fontFamily: 'Inter_400Regular' },
  errorText: { color: Colors.destructive, fontSize: 13, marginTop: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
