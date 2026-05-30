import { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useGetTickets, useCreateTicket, type Ticket } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const STATUS_COLORS: Record<string, string> = { open: Colors.primary, in_progress: Colors.warning, resolved: Colors.success, closed: Colors.mutedForeground };
const STATUS_LABELS: Record<string, string> = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };

function TicketCard({ ticket }: { ticket: Ticket }) {
  const status = (ticket as any).status as string;
  const color = STATUS_COLORS[status] ?? Colors.mutedForeground;
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject} numberOfLines={1}>{(ticket as any).subject ?? "Ticket"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[status] ?? status}</Text>
        </View>
      </View>
      <Text style={styles.ticketMessage} numberOfLines={2}>{(ticket as any).message ?? ""}</Text>
      <Text style={styles.ticketDate}>{(ticket as any).createdAt ? new Date((ticket as any).createdAt).toLocaleDateString("fr-FR") : ""}</Text>
    </View>
  );
}

function CreateModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const insets = useSafeAreaInsets();

  const mutation = useCreateTicket({
    mutation: {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setSubject(""); setMessage(""); onCreated(); onClose(); },
      onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Feather name="x" size={20} color={Colors.foreground} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Nouveau ticket</Text>
          <TouchableOpacity style={[styles.submitBtn, (!subject.trim() || !message.trim() || mutation.isPending) && { opacity: 0.5 }]} onPress={() => mutation.mutate({ ticketInput: { subject: subject.trim(), message: message.trim() } })} disabled={!subject.trim() || !message.trim() || mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Envoyer</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>Sujet</Text>
          <TextInput style={styles.textInput} value={subject} onChangeText={setSubject} placeholder="Décris ton problème..." placeholderTextColor={Colors.mutedForeground} maxLength={100} />
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Message</Text>
          <TextInput style={[styles.textInput, styles.textArea]} value={message} onChangeText={setMessage} placeholder="Explique en détail..." placeholderTextColor={Colors.mutedForeground} multiline numberOfLines={6} textAlignVertical="top" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Support() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const { data: ticketsData, isLoading, refetch } = useGetTickets({});
  const ticketList: Ticket[] = Array.isArray(ticketsData) ? ticketsData : (ticketsData as any)?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}><Feather name="x" size={22} color={Colors.foreground} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={18} color={Colors.primary} />
          <Text style={styles.newBtnText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ticketList}
          keyExtractor={(t, i) => String((t as any).id ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={40} color={Colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucun ticket ouvert</Text>
              <Text style={styles.emptyText}>Tu as un problème ? Ouvre un ticket et notre équipe t'aidera.</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.createBtnText}>Créer un ticket</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <TicketCard ticket={item} />}
        />
      )}
      <CreateModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold" },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primaryDim, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.primary}30` },
  newBtnText: { color: Colors.primary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 14, gap: 10 },
  ticketCard: { backgroundColor: Colors.surface, borderRadius: Colors.radius, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  ticketSubject: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.foreground, fontFamily: "Inter_600SemiBold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  ticketMessage: { fontSize: 13, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 },
  ticketDate: { fontSize: 11, color: `${Colors.mutedForeground}80`, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.foreground, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: Colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: Colors.radius },
  createBtnText: { color: "#fff", fontWeight: "600", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  submitBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  submitBtnText: { color: "#fff", fontWeight: "600", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  textInput: { backgroundColor: Colors.surface, borderRadius: Colors.radiusSm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, color: Colors.foreground, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 120, paddingTop: 12 },
});
