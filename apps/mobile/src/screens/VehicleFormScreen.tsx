import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  API_URL,
  ApiError,
  api,
  type Vehicle,
  type VehiclePayload,
  type VoiceDraft,
} from "../api";
import { queueDraft } from "../drafts";
import { formatBRL } from "../format";

const COMMON_OPTIONS = [
  "Ar-condicionado",
  "Direção hidráulica/elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Alarme",
  "Som",
  "Central multimídia",
  "Câmera de ré",
  "Bancos em couro",
  "Teto solar",
];

const FUELS = ["Flex", "Gasolina", "Etanol", "Diesel", "Híbrido", "Elétrico"];
const TRANSMISSIONS = ["Manual", "Automático", "CVT", "Automatizado"];
const STATUSES: { value: NonNullable<VehiclePayload["status"]>; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
];

function photoUri(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export function VehicleFormScreen({
  accent,
  modules,
  vehicle,
  onDone,
  onCancel,
}: {
  accent: string;
  modules: string[];
  vehicle?: Vehicle;
  onDone: () => void;
  onCancel: () => void;
}) {
  const canVoice = modules.includes("voz");
  const [brand, setBrand] = useState(vehicle?.brand ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [version, setVersion] = useState(vehicle?.version ?? "");
  const [modelYear, setModelYear] = useState(
    vehicle?.modelYear ? String(vehicle.modelYear) : "",
  );
  const [price, setPrice] = useState(
    vehicle?.priceCents ? String(vehicle.priceCents / 100) : "",
  );
  const [mileageKm, setMileageKm] = useState(
    vehicle?.mileageKm ? String(vehicle.mileageKm) : "",
  );
  const [color, setColor] = useState(vehicle?.color ?? "");
  const [fuel, setFuel] = useState(vehicle?.fuel ?? "");
  const [transmission, setTransmission] = useState(vehicle?.transmission ?? "");
  const [engine, setEngine] = useState(vehicle?.engine ?? "");
  const [description, setDescription] = useState(vehicle?.description ?? "");
  const [status, setStatus] = useState<NonNullable<VehiclePayload["status"]>>(
    vehicle?.status ?? "draft",
  );
  const [options, setOptions] = useState<string[]>(vehicle?.options ?? []);
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    vehicle?.photos.map((p) => p.url) ?? [],
  );
  const [fipeCode, setFipeCode] = useState(vehicle?.fipeCode ?? "");
  const [fipePriceCents, setFipePriceCents] = useState<number | undefined>(
    vehicle?.fipePriceCents ?? undefined,
  );

  const [command, setCommand] = useState("");
  const [parsing, setParsing] = useState(false);
  const [candidates, setCandidates] = useState<VoiceDraft["candidates"]>([]);
  const [selectedModelCode, setSelectedModelCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function parseCommand() {
    if (!command.trim()) return;
    setParsing(true);
    setError("");
    try {
      const { draft } = await api.voiceParse(command);
      if (draft.year) setModelYear(String(draft.year));
      if (draft.priceCents) setPrice(String(draft.priceCents / 100));
      if (draft.color)
        setColor(draft.color.charAt(0).toUpperCase() + draft.color.slice(1));
      if (draft.engine) setEngine(draft.engine);
      if (draft.options.length)
        setOptions((prev) => [...new Set([...prev, ...draft.options])]);
      setCandidates(draft.candidates);
      const best = draft.candidates[0];
      if (best) await pickCandidate(best, draft.year);
      setNotice("Ficha pré-preenchida — revise antes de salvar.");
    } catch {
      setError("Não consegui interpretar. Tente de novo ou preencha abaixo.");
    } finally {
      setParsing(false);
    }
  }

  async function pickCandidate(
    c: VoiceDraft["candidates"][number],
    parsedYear?: number,
  ) {
    setSelectedModelCode(c.modelCode);
    setBrand(c.brandName);
    const [first, ...rest] = c.modelName.split(" ");
    setModel(first ?? c.modelName);
    setVersion(rest.join(" "));
    try {
      const { years } = await api.fipeYears(c.brandCode, c.modelCode);
      const y = parsedYear ?? (Number(modelYear) || undefined);
      const match = y ? years.find((it) => it.year === y) : undefined;
      if (match) {
        const { price: p } = await api.fipePrice(c.brandCode, c.modelCode, match.code);
        setFipeCode(p.fipeCode);
        setFipePriceCents(p.priceCents);
        if (p.fuelName) {
          setFuel(
            p.fuelName === "Gasolina" && /flex/i.test(c.modelName)
              ? "Flex"
              : p.fuelName,
          );
        }
      }
    } catch {
      // FIPE flaky — the form still works manually.
    }
  }

  async function addPhotos(fromCamera: boolean) {
    const picker = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await picker({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: !fromCamera,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      for (const asset of result.assets) {
        try {
          const { url } = await api.uploadPhoto(asset.uri);
          setPhotoUrls((prev) => [...prev, url]);
        } catch {
          setError("Falha ao enviar foto — verifique a conexão.");
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function buildPayload(): VehiclePayload {
    return {
      brand,
      model,
      version: version || undefined,
      modelYear: Number(modelYear),
      priceCents: price ? Math.round(Number(price) * 100) : undefined,
      mileageKm: mileageKm ? Number(mileageKm) : undefined,
      color: color || undefined,
      fuel: fuel || undefined,
      transmission: transmission || undefined,
      engine: engine || undefined,
      description: description || undefined,
      options,
      status,
      fipeCode: fipeCode || undefined,
      fipePriceCents,
      photoUrls,
    };
  }

  async function save() {
    setError("");
    if (!brand.trim() || !model.trim() || !modelYear) {
      setError("Marca, modelo e ano são obrigatórios.");
      return;
    }
    setSaving(true);
    const payload = buildPayload();
    try {
      if (vehicle) {
        await api.updateVehicle(vehicle.id, payload);
      } else {
        await api.createVehicle(payload);
      }
      onDone();
    } catch (e) {
      if (!vehicle && !(e instanceof ApiError)) {
        // Network down on the lot: keep the work, sync later.
        await queueDraft(payload);
        Alert.alert(
          "Sem conexão",
          "O veículo foi salvo como rascunho no aparelho e será enviado quando houver sinal.",
        );
        onDone();
      } else {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {/* Voice / command bar */}
        {canVoice && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fale o carro 🎤</Text>
          <Text style={styles.hint}>
            Toque no campo e use o microfone do teclado (ou digite):{" "}
            “Adicionar um Creta 2020 preto 2.0 Prestige completo por 90 mil”
          </Text>
          <View style={styles.commandRow}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Fale ou digite o carro…"
              placeholderTextColor="#a1a1aa"
              value={command}
              onChangeText={setCommand}
              multiline
            />
            <TouchableOpacity
              style={[styles.parseButton, { backgroundColor: accent }]}
              onPress={() => void parseCommand()}
              disabled={parsing || !command.trim()}
            >
              {parsing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.parseButtonText}>OK</Text>
              )}
            </TouchableOpacity>
          </View>
          {candidates.length > 1 && (
            <View style={styles.candidates}>
              <Text style={styles.label}>Confirme a versão FIPE:</Text>
              {candidates.slice(0, 4).map((c) => (
                <TouchableOpacity
                  key={`${c.brandCode}:${c.modelCode}`}
                  style={[
                    styles.candidate,
                    selectedModelCode === c.modelCode && {
                      borderColor: accent,
                      backgroundColor: "#fafafa",
                    },
                  ]}
                  onPress={() => void pickCandidate(c)}
                >
                  <Text style={styles.candidateText}>
                    {c.brandName} — {c.modelName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </View>
        )}

        {/* Ficha */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ficha</Text>
          <View style={styles.rowFields}>
            <Field label="Marca *" value={brand} onChange={setBrand} />
            <Field label="Modelo *" value={model} onChange={setModel} />
          </View>
          <Field label="Versão" value={version} onChange={setVersion} />
          <View style={styles.rowFields}>
            <Field
              label="Ano *"
              value={modelYear}
              onChange={setModelYear}
              keyboard="number-pad"
            />
            <Field
              label="Preço (R$)"
              value={price}
              onChange={setPrice}
              keyboard="number-pad"
            />
          </View>
          {fipePriceCents ? (
            <TouchableOpacity onPress={() => !price && setPrice(String(fipePriceCents / 100))}>
              <Text style={styles.fipeRef}>
                Ref. FIPE: {formatBRL(fipePriceCents)}
                {fipeCode ? ` (${fipeCode})` : ""}
                {!price ? " — tocar para usar" : ""}
              </Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.rowFields}>
            <Field
              label="Km"
              value={mileageKm}
              onChange={setMileageKm}
              keyboard="number-pad"
            />
            <Field label="Cor" value={color} onChange={setColor} />
          </View>
          <View style={styles.rowFields}>
            <Field label="Motor" value={engine} onChange={setEngine} />
          </View>
          <Text style={styles.label}>Combustível</Text>
          <ChipRow items={FUELS} value={fuel} onChange={setFuel} accent={accent} />
          <Text style={styles.label}>Câmbio</Text>
          <ChipRow
            items={TRANSMISSIONS}
            value={transmission}
            onChange={setTransmission}
            accent={accent}
          />
        </View>

        {/* Opcionais */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Opcionais</Text>
          <View style={styles.chips}>
            {[...new Set([...COMMON_OPTIONS, ...options])].map((o) => {
              const on = options.includes(o);
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.chip, on && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() =>
                    setOptions((prev) =>
                      on ? prev.filter((x) => x !== o) : [...prev, o],
                    )
                  }
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fotos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fotos</Text>
          <View style={styles.chips}>
            {photoUrls.map((url) => (
              <View key={url} style={styles.photoWrap}>
                <Image source={{ uri: photoUri(url) }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() =>
                    setPhotoUrls((prev) => prev.filter((u) => u !== url))
                  }
                >
                  <Text style={styles.photoRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.rowFields}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => void addPhotos(true)}
              disabled={uploading}
            >
              <Text style={styles.photoButtonText}>
                {uploading ? "Enviando…" : "📷 Câmera"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => void addPhotos(false)}
              disabled={uploading}
            >
              <Text style={styles.photoButtonText}>🖼 Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Descrição + status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descrição e situação</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Descrição do anúncio…"
            placeholderTextColor="#a1a1aa"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <ChipRow
            items={STATUSES.map((s) => s.label)}
            value={STATUSES.find((s) => s.value === status)?.label ?? ""}
            onChange={(label) => {
              const s = STATUSES.find((x) => x.label === label);
              if (s) setStatus(s.value);
            }}
            accent={accent}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancel} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.save, { backgroundColor: accent }, saving && styles.disabled]}
            onPress={() => void save()}
            disabled={saving || uploading}
          >
            <Text style={styles.saveText}>
              {saving ? "Salvando…" : vehicle ? "Salvar alterações" : "Salvar veículo"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: "number-pad";
}) {
  return (
    <View style={styles.flex}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholderTextColor="#a1a1aa"
      />
    </View>
  );
}

function ChipRow({
  items,
  value,
  onChange,
  accent,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  accent: string;
}) {
  return (
    <View style={styles.chips}>
      {items.map((item) => {
        const on = value === item;
        return (
          <TouchableOpacity
            key={item}
            style={[styles.chip, on && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => onChange(on ? "" : item)}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 12, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14 },
  cardTitle: { fontWeight: "800", fontSize: 15, color: "#18181b", marginBottom: 8 },
  hint: { color: "#71717a", fontSize: 13, marginBottom: 10 },
  commandRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  parseButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
  },
  parseButtonText: { color: "#fff", fontWeight: "800" },
  candidates: { marginTop: 10 },
  candidate: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  candidateText: { color: "#3f3f46", fontSize: 13 },
  notice: { color: "#047857", marginTop: 10, fontWeight: "600", fontSize: 13 },
  rowFields: { flexDirection: "row", gap: 10 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#18181b",
    backgroundColor: "#fff",
  },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  fipeRef: { marginTop: 8, color: "#047857", fontWeight: "600", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, color: "#52525b" },
  chipTextOn: { color: "#fff", fontWeight: "700" },
  photoWrap: { position: "relative" },
  photoThumb: { width: 96, height: 72, borderRadius: 10, backgroundColor: "#e4e4e7" },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#dc2626",
    borderRadius: 999,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: "#fff", fontWeight: "800" },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  photoButtonText: { fontWeight: "600", color: "#3f3f46" },
  error: { color: "#b91c1c", textAlign: "center", fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
  cancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { fontWeight: "700", color: "#52525b" },
  save: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disabled: { opacity: 0.6 },
});
