import { getDb, leads } from "@paperclip/db";

export type NewLead = typeof leads.$inferInsert;

export async function createLead(input: NewLead) {
  const db = getDb();
  const [row] = await db.insert(leads).values(input).returning();
  return row;
}

/** wa.me deep link with vehicle context pre-filled — the primary CTA in Brazil. */
export function whatsappLink(
  whatsapp: string,
  message: string,
): string {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
