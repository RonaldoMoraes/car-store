import AsyncStorage from "@react-native-async-storage/async-storage";
import type { VehiclePayload } from "./api";

// Offline tolerance: saves that fail (no signal on the lot) are queued locally
// and retried from the inventory screen.
const KEY = "pc.pendingDrafts";

export type PendingDraft = {
  localId: string;
  payload: VehiclePayload;
  createdAt: string;
};

export async function listDrafts(): Promise<PendingDraft[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as PendingDraft[]) : [];
}

export async function queueDraft(payload: VehiclePayload): Promise<void> {
  const drafts = await listDrafts();
  drafts.push({
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(drafts));
}

export async function removeDraft(localId: string): Promise<void> {
  const drafts = await listDrafts();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(drafts.filter((d) => d.localId !== localId)),
  );
}
