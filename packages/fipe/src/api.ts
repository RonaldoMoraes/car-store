// Raw client for the endpoints behind veiculos.fipe.org.br (unofficial — decision 005).
// These endpoints are flaky and rate-limited: polite pacing, backoff, and our DB cache
// (see cache.ts) are the actual product; this client is disposable.

const BASE = "https://veiculos.fipe.org.br/api/veiculos";
const MIN_DELAY_MS = 600;
const MAX_RETRIES = 5;

export const VEHICLE_TYPES = { carro: 1, moto: 2, caminhao: 3 } as const;
export type VehicleType = (typeof VEHICLE_TYPES)[keyof typeof VEHICLE_TYPES];

export type FipeReferenceMonth = { Codigo: number; Mes: string };
export type FipeLabelValue = { Label: string; Value: number | string };
export type FipePriceResult = {
  Valor: string; // "R$ 90.000,00"
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel?: string;
};

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  let attempt = 0;
  for (;;) {
    await throttle();
    try {
      const res = await fetch(`${BASE}/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://veiculos.fipe.org.br/",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 429 || res.status >= 500) {
        throw new RetryableError(`FIPE ${path} -> HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`FIPE ${path} -> HTTP ${res.status}`);
      const data = (await res.json()) as T & { erro?: string; codigo?: string };
      if (data && typeof data === "object" && "erro" in data && data.erro) {
        throw new Error(`FIPE ${path} -> ${data.erro}`);
      }
      return data;
    } catch (err) {
      const retryable =
        err instanceof RetryableError ||
        (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError"));
      attempt += 1;
      if (!retryable || attempt > MAX_RETRIES) throw err;
      const backoff = Math.min(60_000, 2 ** attempt * 2_000);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

class RetryableError extends Error {}

export function parseBrlToCents(valor: string): number {
  const digits = valor.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(parseFloat(digits) * 100);
}

export function parseYearCode(yearCode: string): { year: number; fuelCode: number } {
  const [year, fuel] = yearCode.split("-");
  return { year: Number(year), fuelCode: Number(fuel ?? 1) };
}

export const fipeApi = {
  referenceMonths(): Promise<FipeReferenceMonth[]> {
    return post("ConsultarTabelaDeReferencia", {});
  },

  brands(referenceCode: number, vehicleType: VehicleType): Promise<FipeLabelValue[]> {
    return post("ConsultarMarcas", {
      codigoTabelaReferencia: referenceCode,
      codigoTipoVeiculo: vehicleType,
    });
  },

  async models(
    referenceCode: number,
    vehicleType: VehicleType,
    brandCode: string,
  ): Promise<FipeLabelValue[]> {
    const data = await post<{ Modelos: FipeLabelValue[] }>("ConsultarModelos", {
      codigoTabelaReferencia: referenceCode,
      codigoTipoVeiculo: vehicleType,
      codigoMarca: Number(brandCode),
    });
    return data.Modelos ?? [];
  },

  modelYears(
    referenceCode: number,
    vehicleType: VehicleType,
    brandCode: string,
    modelCode: string,
  ): Promise<FipeLabelValue[]> {
    return post("ConsultarAnoModelo", {
      codigoTabelaReferencia: referenceCode,
      codigoTipoVeiculo: vehicleType,
      codigoMarca: Number(brandCode),
      codigoModelo: Number(modelCode),
    });
  },

  price(
    referenceCode: number,
    vehicleType: VehicleType,
    brandCode: string,
    modelCode: string,
    yearCode: string,
  ): Promise<FipePriceResult> {
    const { year, fuelCode } = parseYearCode(yearCode);
    return post("ConsultarValorComTodosParametros", {
      codigoTabelaReferencia: referenceCode,
      codigoTipoVeiculo: vehicleType,
      codigoMarca: Number(brandCode),
      codigoModelo: Number(modelCode),
      anoModelo: year,
      codigoTipoCombustivel: fuelCode,
      tipoVeiculo: vehicleType === 1 ? "carro" : vehicleType === 2 ? "moto" : "caminhao",
      modeloCodigoExterno: "",
      tipoConsulta: "tradicional",
    });
  },
};
