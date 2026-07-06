import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, saveSession, type Session } from "../api";

export function LoginScreen({
  onLogin,
}: {
  onLogin: (session: Session) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [needSlug, setNeedSlug] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const session = await api.login(email.trim(), password, slug.trim() || undefined);
      await saveSession(session);
      onLogin(session);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao entrar";
      if (msg === "ambiguous" || /código da loja/i.test(msg)) {
        setNeedSlug(true);
        setError("Informe o código da loja para continuar.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Painel da loja</Text>
        <Text style={styles.subtitle}>Entre com a conta da sua revenda</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#a1a1aa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#a1a1aa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {needSlug && (
          <TextInput
            style={styles.input}
            placeholder="Código da loja (ex.: demo)"
            placeholderTextColor="#a1a1aa"
            autoCapitalize="none"
            value={slug}
            onChangeText={setSlug}
          />
        )}

        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={submit}
          disabled={busy || !email || !password}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#09090b",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#18181b" },
  subtitle: { marginTop: 4, color: "#71717a", marginBottom: 16 },
  error: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#18181b",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
