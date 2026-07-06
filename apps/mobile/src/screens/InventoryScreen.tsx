import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL, api, type Vehicle } from "../api";
import { listDrafts, removeDraft, type PendingDraft } from "../drafts";
import { formatBRL, formatKm, STATUS_COLOR, STATUS_LABEL } from "../format";

function photoUri(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export function InventoryScreen({
  accent,
  onEdit,
  onAdd,
}: {
  accent: string;
  onEdit: (vehicle: Vehicle) => void;
  onAdd: () => void;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [{ vehicles: list }, pending] = await Promise.all([
        api.listVehicles(),
        listDrafts(),
      ]);
      setVehicles(list);
      setDrafts(pending);
    } catch {
      setError("Sem conexão — mostrando dados locais.");
      setDrafts(await listDrafts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function retryDraft(draft: PendingDraft) {
    try {
      await api.createVehicle(draft.payload);
      await removeDraft(draft.localId);
      await refresh();
    } catch {
      setError("Ainda sem conexão — tente de novo mais tarde.");
    }
  }

  return (
    <View style={styles.root}>
      {error ? <Text style={styles.banner}>{error}</Text> : null}

      {drafts.length > 0 && (
        <View style={styles.draftBox}>
          <Text style={styles.draftTitle}>
            {drafts.length} rascunho{drafts.length > 1 ? "s" : ""} aguardando
            envio
          </Text>
          {drafts.map((d) => (
            <View key={d.localId} style={styles.draftRow}>
              <Text style={styles.draftText} numberOfLines={1}>
                {d.payload.brand} {d.payload.model} {d.payload.modelYear}
              </Text>
              <TouchableOpacity onPress={() => void retryDraft(d)}>
                <Text style={[styles.draftRetry, { color: accent }]}>
                  Reenviar
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refresh()} />
        }
        contentContainerStyle={vehicles.length === 0 && styles.emptyWrap}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhum veículo</Text>
              <Text style={styles.emptyText}>
                Toque em “+ Adicionar” e fale o carro no microfone.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onEdit(item)}>
            {item.photos[0] ? (
              <Image
                source={{ uri: photoUri(item.photos[0].url) }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.noPhoto]}>
                <Text style={styles.noPhotoText}>sem foto</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.brand} {item.model}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.modelYear} · {formatKm(item.mileageKm)}
              </Text>
              <Text style={[styles.price, { color: accent }]}>
                {formatBRL(item.priceCents)}
              </Text>
            </View>
            <View
              style={[
                styles.status,
                { backgroundColor: STATUS_COLOR[item.status] ?? "#71717a" },
              ]}
            >
              <Text style={styles.statusText}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={onAdd}
      >
        <Text style={styles.fabText}>＋ Adicionar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: 10,
    fontSize: 13,
    textAlign: "center",
  },
  draftBox: {
    backgroundColor: "#fffbeb",
    borderBottomWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
  },
  draftTitle: { fontWeight: "700", color: "#92400e", marginBottom: 6 },
  draftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  draftText: { color: "#78350f", flex: 1, marginRight: 12 },
  draftRetry: { fontWeight: "700" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 10,
    gap: 12,
  },
  photo: { width: 84, height: 63, borderRadius: 10, backgroundColor: "#e4e4e7" },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  noPhotoText: { fontSize: 11, color: "#a1a1aa" },
  info: { flex: 1 },
  name: { fontWeight: "700", fontSize: 15, color: "#18181b" },
  meta: { color: "#71717a", fontSize: 13, marginTop: 1 },
  price: { fontWeight: "700", fontSize: 15, marginTop: 3 },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  emptyWrap: { flex: 1, justifyContent: "center" },
  empty: { alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#3f3f46" },
  emptyText: { color: "#71717a", marginTop: 6, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
