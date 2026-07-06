import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, type Lead } from "../api";
import { LEAD_TYPE_LABEL } from "../format";

const STATUS_LABEL: Record<Lead["status"], string> = {
  new: "Novo",
  contacted: "Em contato",
  closed: "Fechado",
};

export function LeadsScreen({ accent }: { accent: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { leads: list } = await api.listLeads();
      setLeads(list);
    } catch {
      // keep whatever we have
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setStatus(lead: Lead, status: Lead["status"]) {
    await api.patchLead(lead.id, status).catch(() => {});
    await refresh();
  }

  return (
    <FlatList
      data={leads}
      keyExtractor={(l) => l.id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void refresh()} />
      }
      contentContainerStyle={leads.length === 0 && styles.emptyWrap}
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum lead ainda</Text>
            <Text style={styles.emptyText}>
              Contatos do site aparecem aqui na hora.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.type, { color: accent }]}>
              {LEAD_TYPE_LABEL[item.type] ?? item.type}
            </Text>
            <Text
              style={[
                styles.leadStatus,
                item.status === "new" && styles.leadStatusNew,
              ]}
            >
              {STATUS_LABEL[item.status]}
            </Text>
          </View>

          <Text style={styles.name}>
            {item.name ?? "Visitante (clique no WhatsApp)"}
          </Text>
          {item.vehicle && (
            <Text style={styles.meta}>
              Interesse: {item.vehicle.brand} {item.vehicle.model}{" "}
              {item.vehicle.modelYear}
            </Text>
          )}
          {item.message ? (
            <Text style={styles.message} numberOfLines={3}>
              “{item.message}”
            </Text>
          ) : null}
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString("pt-BR")}
          </Text>

          <View style={styles.actions}>
            {item.phone ? (
              <TouchableOpacity
                style={[styles.action, styles.whatsapp]}
                onPress={() =>
                  Linking.openURL(
                    `https://wa.me/55${(item.phone ?? "").replace(/\D/g, "")}`,
                  )
                }
              >
                <Text style={styles.actionTextLight}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
            {item.status === "new" && (
              <TouchableOpacity
                style={styles.action}
                onPress={() => void setStatus(item, "contacted")}
              >
                <Text style={styles.actionText}>Em contato</Text>
              </TouchableOpacity>
            )}
            {item.status !== "closed" && (
              <TouchableOpacity
                style={styles.action}
                onPress={() => void setStatus(item, "closed")}
              >
                <Text style={styles.actionText}>Fechar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  type: { fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  leadStatus: { fontSize: 12, color: "#71717a", fontWeight: "600" },
  leadStatusNew: { color: "#dc2626" },
  name: { fontWeight: "700", fontSize: 15, color: "#18181b", marginTop: 6 },
  meta: { color: "#52525b", fontSize: 13, marginTop: 2 },
  message: { color: "#3f3f46", marginTop: 6, fontStyle: "italic" },
  date: { color: "#a1a1aa", fontSize: 12, marginTop: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  action: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  whatsapp: { backgroundColor: "#25D366", borderColor: "#25D366" },
  actionText: { fontSize: 13, fontWeight: "600", color: "#3f3f46" },
  actionTextLight: { fontSize: 13, fontWeight: "700", color: "#fff" },
  emptyWrap: { flex: 1, justifyContent: "center" },
  empty: { alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#3f3f46" },
  emptyText: { color: "#71717a", marginTop: 6 },
});
