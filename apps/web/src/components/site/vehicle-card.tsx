import Link from "next/link";
import {
  formatKm,
  formatPriceBRL,
  type VehicleWithPhotos,
} from "@paperclip/core";
import { FipeBadge } from "./fipe-badge";

export function VehicleCard({ vehicle }: { vehicle: VehicleWithPhotos }) {
  const photo = vehicle.photos[0];
  return (
    <Link
      href={`/veiculo/${vehicle.id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            sem foto
          </div>
        )}
        <FipeBadge
          priceCents={vehicle.priceCents}
          fipePriceCents={vehicle.fipePriceCents}
          className="absolute left-3 top-3"
        />
      </div>

      <div className="space-y-2 p-4">
        <div>
          <h3 className="font-semibold text-zinc-900">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="line-clamp-1 text-sm text-zinc-500">{vehicle.version}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-zinc-600">
          <span className="rounded-md bg-zinc-100 px-2 py-1">
            {vehicle.modelYear}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-1">
            {formatKm(vehicle.mileageKm)}
          </span>
          {vehicle.transmission && (
            <span className="rounded-md bg-zinc-100 px-2 py-1">
              {vehicle.transmission}
            </span>
          )}
        </div>

        <p
          className="text-xl font-bold"
          style={{ color: "var(--tenant-accent)" }}
        >
          {formatPriceBRL(vehicle.priceCents)}
        </p>
      </div>
    </Link>
  );
}
