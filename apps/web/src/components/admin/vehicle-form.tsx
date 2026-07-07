"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import type { VehicleInput } from "@/lib/vehicle-input";

type FipeOption = { code: string; name: string };
type FipeYear = { code: string; year: number; fuelCode: number };
type Candidate = {
  brandCode: string;
  brandName: string;
  modelCode: string;
  modelName: string;
  score: number;
};

const COMMON_OPTIONS = [
  "Ar-condicionado",
  "Direção hidráulica/elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Alarme",
  "Som",
  "Central multimídia",
  "Câmera de ré",
  "Sensor de estacionamento",
  "Bancos em couro",
  "Teto solar",
  "Rodas de liga leve",
];

const COLORS = [
  "Preto", "Branco", "Prata", "Cinza", "Vermelho", "Azul", "Verde",
  "Amarelo", "Marrom", "Bege", "Dourado", "Grafite", "Vinho", "Laranja",
];

const FUELS = ["Flex", "Gasolina", "Etanol", "Diesel", "Híbrido", "Elétrico"];
const TRANSMISSIONS = ["Manual", "Automático", "CVT", "Automatizado"];

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";
const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500";

export type VehicleFormInitial = Partial<VehicleInput> & { id?: string };

const CALENDAR_YEARS = Array.from(
  { length: new Date().getFullYear() + 2 - 1980 },
  (_, i) => new Date().getFullYear() + 1 - i,
);

export function VehicleForm({
  initial,
  modules,
}: {
  initial?: VehicleFormInitial;
  modules: string[];
}) {
  const router = useRouter();
  const canVoice = modules.includes("voz");
  const canFipe = modules.includes("fipe");

  // ——— fields ———
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [version, setVersion] = useState(initial?.version ?? "");
  const [modelYear, setModelYear] = useState(initial?.modelYear?.toString() ?? "");
  const [price, setPrice] = useState(
    initial?.priceCents ? String(initial.priceCents / 100) : "",
  );
  const [mileageKm, setMileageKm] = useState(initial?.mileageKm?.toString() ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [fuel, setFuel] = useState(initial?.fuel ?? "");
  const [transmission, setTransmission] = useState(initial?.transmission ?? "");
  const [doors, setDoors] = useState(initial?.doors?.toString() ?? "4");
  const [engine, setEngine] = useState(initial?.engine ?? "");
  const [plate, setPlate] = useState(initial?.plate ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "draft");
  const [options, setOptions] = useState<string[]>(initial?.options ?? []);
  const [customOption, setCustomOption] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>(initial?.photoUrls ?? []);
  const [fipeCode, setFipeCode] = useState(initial?.fipeCode ?? "");
  const [fipeRef, setFipeRef] = useState<number | undefined>(
    initial?.fipeReferenceCode,
  );
  const [fipePriceCents, setFipePriceCents] = useState<number | undefined>(
    initial?.fipePriceCents ?? undefined,
  );

  // ——— ui state ———
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ——— FIPE pickers ———
  const [brands, setBrands] = useState<FipeOption[]>([]);
  const [models, setModels] = useState<FipeOption[]>([]);
  const [years, setYears] = useState<FipeYear[]>([]);
  const [fipeBrand, setFipeBrand] = useState("");
  const [fipeModel, setFipeModel] = useState("");
  const [fipeModelName, setFipeModelName] = useState("");
  const [fipeYear, setFipeYear] = useState("");
  // Year-first path: the dealer picks a calendar year before any model.
  const [fipeCalendarYear, setFipeCalendarYear] = useState<number | "">("");
  const [fipeLoading, setFipeLoading] = useState(false);

  useEffect(() => {
    if (!canFipe) return;
    fetch("/api/admin/fipe?q=brands")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBrands(d.brands))
      .catch(() => {});
  }, [canFipe]);

  const loadModels = useCallback(async (brandCode: string) => {
    setModels([]);
    setYears([]);
    setFipeModel("");
    setFipeModelName("");
    setFipeYear("");
    setFipeCalendarYear("");
    if (!brandCode) return;
    const r = await fetch(`/api/admin/fipe?q=models&brand=${brandCode}`);
    if (r.ok) setModels((await r.json()).models);
  }, []);

  // Year-first: picking a calendar year (with no model chosen) narrows the
  // model list to what that brand sold that year.
  const selectCalendarYear = useCallback(
    async (value: string) => {
      const year = value ? Number(value) : "";
      setFipeCalendarYear(year);
      if (!year || !fipeBrand || fipeModel) return;
      setFipeLoading(true);
      try {
        const r = await fetch(
          `/api/admin/fipe?q=modelsByYear&brand=${fipeBrand}&calendarYear=${year}`,
        );
        if (r.ok) {
          const { models: byYear } = await r.json();
          setModels(byYear);
          setNotice(
            byYear.length > 0
              ? `${byYear.length} modelos de ${year} — escolha o modelo.`
              : `Nenhum modelo dessa marca em ${year}.`,
          );
        }
      } finally {
        setFipeLoading(false);
      }
    },
    [fipeBrand, fipeModel],
  );

  // Clear model+year (either order) but keep the brand — restart the search.
  const clearFipeSelection = useCallback(async () => {
    setFipeModel("");
    setFipeModelName("");
    setFipeYear("");
    setFipeCalendarYear("");
    setYears([]);
    setNotice("");
    if (fipeBrand) {
      const r = await fetch(`/api/admin/fipe?q=models&brand=${fipeBrand}`);
      if (r.ok) setModels((await r.json()).models);
    }
  }, [fipeBrand]);

  const loadYears = useCallback(
    async (brandCode: string, modelCode: string) => {
      setYears([]);
      setFipeYear("");
      if (!brandCode || !modelCode) return [] as FipeYear[];
      const r = await fetch(
        `/api/admin/fipe?q=years&brand=${brandCode}&model=${modelCode}`,
      );
      if (!r.ok) return [] as FipeYear[];
      const ys = (await r.json()).years as FipeYear[];
      setYears(ys);
      return ys;
    },
    [],
  );

  const applyFipePrice = useCallback(
    async (brandCode: string, modelCode: string, yearCode: string) => {
      setFipeLoading(true);
      try {
        const r = await fetch(
          `/api/admin/fipe?q=price&brand=${brandCode}&model=${modelCode}&year=${yearCode}`,
        );
        if (!r.ok) {
          setNotice("FIPE indisponível agora — preencha manualmente.");
          return;
        }
        const { ref, price: p } = await r.json();
        setFipeRef(ref);
        setFipeCode(p.fipeCode);
        setFipePriceCents(p.priceCents);
        if (p.brandName) setBrand(p.brandName);
        if (p.modelName) {
          const [first, ...rest] = String(p.modelName).split(" ");
          setModel(first ?? p.modelName);
          if (rest.length && !version) setVersion(rest.join(" "));
        }
        if (p.year) setModelYear(String(p.year));
        if (p.fuelName) {
          const f = String(p.fuelName);
          setFuel(f === "Gasolina" && /flex/i.test(String(p.modelName)) ? "Flex" : f);
        }
        setNotice(
          `FIPE: R$ ${(p.priceCents / 100).toLocaleString("pt-BR")} (código ${p.fipeCode})`,
        );
      } finally {
        setFipeLoading(false);
      }
    },
    [version],
  );

  // ——— voice (decision 011) ———
  const voiceSupported = useSyncExternalStore(
    () => () => {},
    () => {
      const w = window as unknown as Record<string, unknown>;
      return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
    },
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const applyDraft = useCallback(
    async (draft: {
      year?: number;
      priceCents?: number;
      color?: string;
      engine?: string;
      options: string[];
      candidates: Candidate[];
    }) => {
      if (draft.year) setModelYear(String(draft.year));
      if (draft.priceCents) setPrice(String(draft.priceCents / 100));
      if (draft.color) {
        const c = draft.color.charAt(0).toUpperCase() + draft.color.slice(1);
        setColor(c);
      }
      if (draft.engine) setEngine(draft.engine);
      if (draft.options.length) {
        setOptions((prev) => [...new Set([...prev, ...draft.options])]);
      }
      setCandidates(draft.candidates);
      const best = draft.candidates[0];
      if (best) {
        await selectCandidate(best, draft.year);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function selectCandidate(c: Candidate, parsedYear?: number) {
    setBrand(c.brandName);
    const [first, ...rest] = c.modelName.split(" ");
    setModel(first ?? c.modelName);
    setVersion(rest.join(" "));
    setFipeBrand(c.brandCode);
    setFipeModel(c.modelCode);
    setFipeModelName(c.modelName);
    const ys = await loadYears(c.brandCode, c.modelCode);
    const y = parsedYear ?? (Number(modelYear) || undefined);
    const match = y ? ys.find((it) => it.year === y) : undefined;
    if (match) {
      setFipeYear(match.code);
      await applyFipePrice(c.brandCode, c.modelCode, match.code);
    }
  }

  async function parseTranscript(text: string) {
    if (!text.trim()) return;
    setParsing(true);
    setError("");
    try {
      const r = await fetch("/api/admin/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      if (!r.ok) throw new Error("parse failed");
      const { draft } = await r.json();
      await applyDraft(draft);
      setNotice("Formulário pré-preenchido a partir da sua fala — revise e salve.");
    } catch {
      setError("Não consegui interpretar — preencha manualmente ou tente de novo.");
    } finally {
      setParsing(false);
    }
  }

  function startVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor() as {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
      stop: () => void;
    };
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      finalText = Array.from({ length: e.results.length }, (_, i) =>
        e.results[i]?.[0]?.transcript ?? "",
      ).join(" ");
      setTranscript(finalText);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) void parseTranscript(finalText);
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setTranscript("");
    setListening(true);
    rec.start();
  }

  // ——— photos ———
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/admin/photos", { method: "POST", body: fd });
        if (r.ok) {
          const { url } = await r.json();
          setPhotoUrls((prev) => [...prev, url]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  // ——— submit ———
  async function save() {
    setError("");
    if (!brand.trim() || !model.trim() || !modelYear) {
      setError("Marca, modelo e ano são obrigatórios.");
      return;
    }
    setSaving(true);
    const body: VehicleInput = {
      brand,
      model,
      version: version || undefined,
      modelYear: Number(modelYear),
      priceCents: price ? Math.round(Number(price) * 100) : undefined,
      mileageKm: mileageKm ? Number(mileageKm) : undefined,
      color: color || undefined,
      fuel: fuel || undefined,
      transmission: transmission || undefined,
      doors: doors ? Number(doors) : undefined,
      engine: engine || undefined,
      plate: plate || undefined,
      options,
      description: description || undefined,
      status: status as VehicleInput["status"],
      fipeCode: fipeCode || undefined,
      fipeReferenceCode: fipeRef,
      fipePriceCents,
      photoUrls,
    };
    const isEdit = Boolean(initial?.id);
    const r = await fetch(
      isEdit ? `/api/admin/vehicles/${initial!.id}` : "/api/admin/vehicles",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "Erro ao salvar.");
      return;
    }
    router.push("/admin/veiculos");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Voice */}
      {canVoice && (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={listening ? () => recognitionRef.current?.stop() : startVoice}
            disabled={!voiceSupported || parsing}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${
              listening ? "animate-pulse bg-red-600" : "bg-zinc-900 hover:bg-zinc-700"
            }`}
          >
            {listening ? "■ Parar" : "🎤 Falar o carro"}
          </button>
          <p className="text-sm text-zinc-500">
            {voiceSupported
              ? "Ex.: “Adicionar um Creta 2020 preto 2.0 Prestige completo por 90 mil reais”"
              : "Ditado por voz não é suportado neste navegador (use Chrome)."}
          </p>
        </div>
        {(transcript || parsing) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm italic text-zinc-700">
              “{transcript}”
            </p>
            {parsing ? (
              <span className="text-sm text-zinc-400">interpretando…</span>
            ) : (
              <button
                type="button"
                onClick={() => parseTranscript(transcript)}
                className="text-sm font-semibold text-zinc-600 underline"
              >
                Reinterpretar
              </button>
            )}
          </div>
        )}
        {candidates.length > 1 && (
          <div className="mt-3">
            <label className={labelClass}>Confirme a versão FIPE</label>
            <select
              className={inputClass}
              value={fipeModel}
              onChange={(e) => {
                const c = candidates.find((x) => x.modelCode === e.target.value);
                if (c) void selectCandidate(c);
              }}
            >
              {candidates.map((c) => (
                <option key={`${c.brandCode}:${c.modelCode}`} value={c.modelCode}>
                  {c.brandName} — {c.modelName}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>
      )}

      {/* FIPE assist */}
      {canFipe && (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">
            Busca FIPE (preenche a ficha) — modelo ou ano, na ordem que preferir
          </h2>
          {(fipeModel || fipeYear || fipeCalendarYear) && (
            <button
              type="button"
              onClick={() => void clearFipeSelection()}
              className="text-xs font-semibold text-zinc-500 underline hover:text-zinc-800"
            >
              Limpar modelo/ano
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Marca</label>
            <select
              className={inputClass}
              value={fipeBrand}
              onChange={(e) => {
                setFipeBrand(e.target.value);
                void loadModels(e.target.value);
              }}
            >
              <option value="">Selecione…</option>
              {brands.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Modelo{fipeCalendarYear ? ` (de ${fipeCalendarYear})` : ""}
            </label>
            <input
              className={inputClass}
              list="fipe-models"
              value={fipeModelName}
              disabled={!fipeBrand}
              placeholder={
                !fipeBrand
                  ? "Escolha a marca"
                  : models.length
                    ? "Digite para buscar…"
                    : "Carregando…"
              }
              onChange={(e) => {
                setFipeModelName(e.target.value);
                const m = models.find((x) => x.name === e.target.value);
                if (m) {
                  setFipeModel(m.code);
                  void (async () => {
                    const ys = await loadYears(fipeBrand, m.code);
                    // Year-first: auto-resolve the FIPE year and price.
                    if (fipeCalendarYear) {
                      const match = ys.find((y) => y.year === fipeCalendarYear);
                      if (match) {
                        setFipeYear(match.code);
                        await applyFipePrice(fipeBrand, m.code, match.code);
                      }
                    }
                  })();
                }
              }}
            />
            <datalist id="fipe-models">
              {models.map((m) => (
                <option key={m.code} value={m.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Ano</label>
            {years.length > 0 ? (
              <select
                className={inputClass}
                value={fipeYear}
                onChange={(e) => {
                  setFipeYear(e.target.value);
                  if (e.target.value) {
                    void applyFipePrice(fipeBrand, fipeModel, e.target.value);
                  }
                }}
              >
                <option value="">Selecione…</option>
                {years.map((y) => (
                  <option key={y.code} value={y.code}>
                    {y.year === 32000 ? "Zero km" : y.year}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className={inputClass}
                value={fipeCalendarYear}
                disabled={!fipeBrand}
                onChange={(e) => void selectCalendarYear(e.target.value)}
              >
                <option value="">
                  {fipeBrand ? "Ou comece pelo ano…" : "Escolha a marca"}
                </option>
                {CALENDAR_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {(fipeLoading || notice) && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            {fipeLoading ? "Consultando FIPE…" : notice}
          </p>
        )}
      </section>
      )}

      {/* Ficha */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">
          Ficha do veículo
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>Marca *</label>
            <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Modelo *</label>
            <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Versão</label>
            <input className={inputClass} value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Ano modelo *</label>
            <input className={inputClass} type="number" value={modelYear} onChange={(e) => setModelYear(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Preço (R$)</label>
            <input className={inputClass} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Km</label>
            <input className={inputClass} type="number" value={mileageKm} onChange={(e) => setMileageKm(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Cor</label>
            <input className={inputClass} list="cores" value={color} onChange={(e) => setColor(e.target.value)} />
            <datalist id="cores">
              {COLORS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Combustível</label>
            <select className={inputClass} value={fuel} onChange={(e) => setFuel(e.target.value)}>
              <option value="">—</option>
              {FUELS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Câmbio</label>
            <select className={inputClass} value={transmission} onChange={(e) => setTransmission(e.target.value)}>
              <option value="">—</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Portas</label>
            <select className={inputClass} value={doors} onChange={(e) => setDoors(e.target.value)}>
              {["2", "3", "4", "5"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Motor</label>
            <input className={inputClass} value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="1.0, 2.0…" />
          </div>
          <div>
            <label className={labelClass}>Placa (não aparece no site)</label>
            <input className={inputClass} value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>
        </div>

        {fipePriceCents ? (
          <p className="mt-3 text-sm text-zinc-500">
            Referência FIPE:{" "}
            <strong className="text-zinc-800">
              R$ {(fipePriceCents / 100).toLocaleString("pt-BR")}
            </strong>{" "}
            {fipeCode && <span>(código {fipeCode})</span>}
            {!price && (
              <button
                type="button"
                className="ml-2 font-semibold text-emerald-700 underline"
                onClick={() => setPrice(String(fipePriceCents / 100))}
              >
                usar como preço
              </button>
            )}
          </p>
        ) : null}
      </section>

      {/* Opcionais */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">
          Opcionais
        </h2>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...COMMON_OPTIONS, ...options])].map((o) => {
            const on = options.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() =>
                  setOptions((prev) =>
                    on ? prev.filter((x) => x !== o) : [...prev, o],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 text-zinc-600 hover:border-zinc-500"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className={inputClass}
            value={customOption}
            onChange={(e) => setCustomOption(e.target.value)}
            placeholder="Outro opcional…"
          />
          <button
            type="button"
            className="shrink-0 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={() => {
              if (customOption.trim()) {
                setOptions((prev) => [...new Set([...prev, customOption.trim()])]);
                setCustomOption("");
              }
            }}
          >
            Adicionar
          </button>
        </div>
      </section>

      {/* Fotos */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">
          Fotos
        </h2>
        <div className="flex flex-wrap gap-3">
          {photoUrls.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="h-24 w-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setPhotoUrls((prev) => prev.filter((u) => u !== url))
                }
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                aria-label="Remover foto"
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex h-24 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-600">
            {uploading ? "Enviando…" : "+ Fotos"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => void uploadFiles(e.target.files)}
            />
          </label>
        </div>
      </section>

      {/* Descrição + status + salvar */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <label className={labelClass}>Descrição</label>
        <textarea
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className={labelClass}>Situação</label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado no site</option>
              <option value="reserved">Reservado</option>
              <option value="sold">Vendido</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || uploading}
              className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "Salvando…" : initial?.id ? "Salvar alterações" : "Salvar veículo"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
