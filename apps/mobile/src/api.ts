import AsyncStorage from "@react-native-async-storage/async-storage";

// Platform API base. Point EXPO_PUBLIC_API_URL at your machine's LAN IP when
// testing on a physical device (e.g. http://192.168.0.10:3000).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "pc.token";
const SESSION_KEY = "pc.session";

export type TenantTheme = {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
};

export type SessionTenant = {
  id: string;
  slug: string;
  name: string;
  theme: TenantTheme;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
};

export type SessionUser = { id: string; name: string; role: string };

export type Session = { token: string; tenant: SessionTenant; user: SessionUser };

export type Vehicle = {
  id: string;
  status: "draft" | "published" | "reserved" | "sold";
  brand: string;
  model: string;
  version: string | null;
  modelYear: number;
  priceCents: number | null;
  mileageKm: number | null;
  color: string | null;
  fuel: string | null;
  transmission: string | null;
  doors: number | null;
  engine: string | null;
  plate: string | null;
  options: string[];
  description: string | null;
  fipeCode: string | null;
  fipePriceCents: number | null;
  photos: { id: string; url: string; position: number }[];
};

export type Lead = {
  id: string;
  type: "whatsapp" | "form" | "call" | "financing" | "trade_in";
  status: "new" | "contacted" | "closed";
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  vehicle: { id: string; brand: string; model: string; modelYear: number } | null;
};

export type VoiceDraft = {
  transcript: string;
  year?: number;
  priceCents?: number;
  color?: string;
  engine?: string;
  options: string[];
  candidates: {
    brandCode: string;
    brandName: string;
    modelCode: string;
    modelName: string;
    score: number;
  }[];
};

export type VehiclePayload = {
  brand: string;
  model: string;
  version?: string;
  modelYear: number;
  priceCents?: number;
  mileageKm?: number;
  color?: string;
  fuel?: string;
  transmission?: string;
  doors?: number;
  engine?: string;
  plate?: string;
  options?: string[];
  description?: string;
  status?: Vehicle["status"];
  fipeCode?: string;
  fipeReferenceCode?: number;
  fipePriceCents?: number;
  photoUrls?: string[];
};

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, session.token],
    [SESSION_KEY, JSON.stringify(session)],
  ]);
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, SESSION_KEY]);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (init.body && typeof init.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new ApiError(data.message ?? data.error ?? `HTTP ${res.status}`, res.status);
  }
  return data;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const api = {
  login(email: string, password: string, slug?: string): Promise<Session> {
    return request<Session>(
      "/api/mobile/login",
      { method: "POST", body: JSON.stringify({ email, password, slug }) },
      false,
    );
  },

  me(): Promise<{ tenant: SessionTenant }> {
    return request("/api/mobile/me");
  },

  listVehicles(): Promise<{ vehicles: Vehicle[] }> {
    return request("/api/admin/vehicles");
  },

  createVehicle(payload: VehiclePayload): Promise<{ id: string }> {
    return request("/api/admin/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateVehicle(id: string, payload: VehiclePayload): Promise<{ ok: true }> {
    return request(`/api/admin/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  listLeads(): Promise<{ leads: Lead[] }> {
    return request("/api/admin/leads");
  },

  patchLead(id: string, status: Lead["status"]): Promise<{ ok: true }> {
    return request(`/api/admin/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  voiceParse(transcript: string): Promise<{ ref: number; draft: VoiceDraft }> {
    return request("/api/admin/voice-parse", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    });
  },

  fipeYears(
    brand: string,
    model: string,
  ): Promise<{ years: { code: string; year: number; fuelCode: number }[] }> {
    return request(`/api/admin/fipe?q=years&brand=${brand}&model=${model}`);
  },

  fipePrice(
    brand: string,
    model: string,
    year: string,
  ): Promise<{
    ref: number;
    price: {
      fipeCode: string;
      priceCents: number;
      brandName: string | null;
      modelName: string | null;
      year: number | null;
      fuelName: string | null;
    };
  }> {
    return request(`/api/admin/fipe?q=price&brand=${brand}&model=${model}&year=${year}`);
  },

  async uploadPhoto(uri: string): Promise<{ url: string }> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const form = new FormData();
    const name = uri.split("/").pop() ?? "foto.jpg";
    const ext = name.split(".").pop()?.toLowerCase();
    const type =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    // React Native FormData file object
    form.append("file", { uri, name, type } as unknown as Blob);
    const res = await fetch(`${API_URL}/api/admin/photos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) throw new ApiError(`upload failed (${res.status})`, res.status);
    return (await res.json()) as { url: string };
  },
};
