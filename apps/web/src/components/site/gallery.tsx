"use client";

import { useState } from "react";
import type { VehiclePhoto } from "@paperclip/core";

export function Gallery({
  photos,
  alt,
}: {
  photos: VehiclePhoto[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  if (!current) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
        sem fotos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={alt}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-zinc-900" : "border-transparent"
              }`}
              aria-label={`Foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="aspect-[4/3] w-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
