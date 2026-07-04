// Voice add-a-car parser (decision 011) — heuristic v1, zero external spend.
// Turns "Adicionar um Creta 2020 preto 2.0 prestige completo por 90 mil reais"
// into a pre-filled vehicle draft, resolving brand+model against the FIPE cache.
// An LLM parse can replace/augment this later behind the same contract.

import { type Db } from "@paperclip/db";
import { searchModelsByName } from "./cache";

export type ParsedVehicleDraft = {
  transcript: string;
  year?: number;
  priceCents?: number;
  color?: string;
  engine?: string;
  options: string[];
  modelQuery?: string;
  candidates: Array<{
    brandCode: string;
    brandName: string;
    modelCode: string;
    modelName: string;
    score: number;
  }>;
};

const COLORS = [
  "preto", "branco", "prata", "cinza", "vermelho", "azul", "verde",
  "amarelo", "marrom", "bege", "dourado", "grafite", "vinho", "laranja",
];

// "completo" — the dealer shorthand for the standard options set.
export const COMPLETO_OPTIONS = [
  "Ar-condicionado",
  "Direção hidráulica/elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Alarme",
  "Som",
];

const STOPWORDS = new Set([
  "adicionar", "adiciona", "cadastrar", "cadastra", "novo", "nova",
  "um", "uma", "o", "a", "de", "do", "da", "com", "por", "carro",
  "veiculo", "veículo", "reais", "mil", "r$", "e", "no", "na", "em",
  "estoque", "inventario", "inventário", "completo", "completa",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function parsePriceCents(text: string): number | undefined {
  const t = normalize(text);
  // "90 mil", "90mil", "90.5 mil"
  const mil = t.match(/(\d+(?:[.,]\d+)?)\s*mil\b/);
  if (mil?.[1]) {
    return Math.round(parseFloat(mil[1].replace(",", ".")) * 1000 * 100);
  }
  // "r$ 90.000", "90.000 reais", "90000 reais"
  const brl = t.match(/(?:r\$\s*)?([\d.]{4,})(?:\s*reais)?/);
  if (brl?.[1]) {
    const digits = parseInt(brl[1].replace(/\./g, ""), 10);
    if (digits >= 1000) return digits * 100;
  }
  return undefined;
}

export function parseYear(text: string): number | undefined {
  const m = text.match(/\b(19[5-9]\d|20[0-4]\d)\b/);
  return m ? Number(m[0]) : undefined;
}

export async function parseVoiceCommand(
  db: Db,
  referenceCode: number,
  vehicleType: 1 | 2 | 3,
  transcript: string,
): Promise<ParsedVehicleDraft> {
  const draft: ParsedVehicleDraft = {
    transcript,
    options: [],
    candidates: [],
  };

  const norm = normalize(transcript);
  draft.year = parseYear(norm);
  draft.priceCents = parsePriceCents(norm);
  draft.color = COLORS.find((c) => new RegExp(`\\b${c}\\b`).test(norm));
  const engine = norm.match(/\b(\d\.\d)\b/);
  if (engine?.[1]) draft.engine = engine[1];
  if (/\bcomplet[oa]\b/.test(norm)) draft.options = [...COMPLETO_OPTIONS];

  // Candidate model tokens = whatever is left after removing everything we understood.
  const tokens = norm
    .replace(/\b(19[5-9]\d|20[0-4]\d)\b/g, " ")
    .replace(/(\d+(?:[.,]\d+)?)\s*mil\b/g, " ")
    .replace(/r\$\s*[\d.,]+/g, " ")
    .replace(/\b[\d.,]{4,}\b/g, " ")
    .split(/[^a-z0-9.]+/)
    .filter((w) => w && !STOPWORDS.has(w) && !COLORS.includes(w));

  const trimTokens = tokens.filter((t) => t !== draft.engine);
  if (trimTokens.length === 0) return draft;

  // Search FIPE for each remaining token; the one with hits is the model name,
  // the others (e.g. "prestige") rank the trim among that model's variants.
  const seen = new Map<string, ParsedVehicleDraft["candidates"][number]>();
  for (const token of trimTokens) {
    if (token.length < 3) continue;
    const matches = await searchModelsByName(db, referenceCode, vehicleType, token, 25);
    if (matches.length === 0) continue;
    draft.modelQuery = draft.modelQuery ?? token;
    for (const m of matches) {
      const key = `${m.brandCode}:${m.modelCode}`;
      const modelNorm = normalize(m.modelName);
      let score = 1;
      for (const other of trimTokens) {
        if (other !== token && modelNorm.includes(other)) score += 2;
      }
      if (draft.engine && modelNorm.includes(draft.engine)) score += 2;
      const existing = seen.get(key);
      if (!existing || existing.score < score) {
        seen.set(key, { ...m, score });
      }
    }
  }

  draft.candidates = [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return draft;
}
