export type VehicleInput = {
  brand: string;
  model: string;
  version?: string;
  modelYear: number;
  manufactureYear?: number;
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
  status?: "draft" | "published" | "reserved" | "sold";
  fipeCode?: string;
  fipeReferenceCode?: number;
  fipePriceCents?: number;
  photoUrls?: string[];
};

export function vehicleValues(input: VehicleInput) {
  return {
    brand: input.brand.trim(),
    model: input.model.trim(),
    version: input.version?.trim() || null,
    modelYear: input.modelYear,
    manufactureYear: input.manufactureYear ?? null,
    priceCents: input.priceCents ?? null,
    mileageKm: input.mileageKm ?? null,
    color: input.color?.trim() || null,
    fuel: input.fuel?.trim() || null,
    transmission: input.transmission?.trim() || null,
    doors: input.doors ?? null,
    engine: input.engine?.trim() || null,
    plate: input.plate?.trim() || null,
    options: input.options ?? [],
    description: input.description?.trim() || null,
    fipeCode: input.fipeCode ?? null,
    fipeReferenceCode: input.fipeReferenceCode ?? null,
    fipePriceCents: input.fipePriceCents ?? null,
  };
}
