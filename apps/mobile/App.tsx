import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  clearSession,
  loadSession,
  type Session,
  type Vehicle,
} from "./src/api";
import { LoginScreen } from "./src/screens/LoginScreen";
import { InventoryScreen } from "./src/screens/InventoryScreen";
import { LeadsScreen } from "./src/screens/LeadsScreen";
import { VehicleFormScreen } from "./src/screens/VehicleFormScreen";

type Screen =
  | { name: "inventory" }
  | { name: "leads" }
  | { name: "form"; vehicle?: Vehicle };

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "inventory" });

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLogin={setSession} />
      </>
    );
  }

  const primary = session.tenant.theme.primaryColor ?? "#0f172a";
  const accent = session.tenant.theme.accentColor ?? "#dc2626";
  const inForm = screen.name === "form";

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <SafeAreaView style={{ backgroundColor: primary }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{session.tenant.name}</Text>
            <Text style={styles.headerSub}>
              {inForm
                ? screen.vehicle
                  ? "Editar veículo"
                  : "Adicionar veículo"
                : session.user.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              void clearSession();
              setSession(null);
            }}
          >
            <Text style={styles.logout}>Sair</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={[styles.flex, styles.body]}>
        {screen.name === "inventory" && (
          <InventoryScreen
            accent={accent}
            onAdd={() => setScreen({ name: "form" })}
            onEdit={(vehicle) => setScreen({ name: "form", vehicle })}
          />
        )}
        {screen.name === "leads" && <LeadsScreen accent={accent} />}
        {screen.name === "form" && (
          <VehicleFormScreen
            accent={accent}
            vehicle={screen.vehicle}
            onDone={() => setScreen({ name: "inventory" })}
            onCancel={() => setScreen({ name: "inventory" })}
          />
        )}
      </View>

      {!inForm && (
        <SafeAreaView style={styles.tabsWrap}>
          <View style={styles.tabs}>
            <TabButton
              label="🚗 Estoque"
              active={screen.name === "inventory"}
              accent={accent}
              onPress={() => setScreen({ name: "inventory" })}
            />
            <TabButton
              label="💬 Leads"
              active={screen.name === "leads"}
              accent={accent}
              onPress={() => setScreen({ name: "leads" })}
            />
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function TabButton({
  label,
  active,
  accent,
  onPress,
}: {
  label: string;
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text
        style={[styles.tabText, active && { color: accent, fontWeight: "800" }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 17 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  logout: { color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  body: { backgroundColor: "#f4f4f5" },
  tabsWrap: { backgroundColor: "#fff" },
  tabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fff",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14, color: "#71717a", fontWeight: "600" },
});
