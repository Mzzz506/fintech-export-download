import { z } from "zod";
import { infrai } from "./infrai.js";

export const exportRequest = z.object({ accountId: z.string().min(1), from: z.string().date(), to: z.string().date(), events: z.array(z.object({ id: z.string(), occurredAt: z.string(), amountCents: z.number().int(), currency: z.string(), status: z.enum(["authorized", "captured", "declined"]) })) });
export type ExportRequest = z.infer<typeof exportRequest>;
export type ExportResult = { key: string; downloadUrl: string; notification: string };

function csv(input: ExportRequest): string {
  return ["event_id,occurred_at,amount_cents,currency,status", ...input.events.map((e) => `${e.id},${e.occurredAt},${e.amountCents},${e.currency},${e.status}`)].join("\n");
}

export function shouldExport(input: ExportRequest): boolean { return input.events.length > 0 && input.events.every((e) => e.status !== "declined"); }

export function exportBucketName(accountId: string): string { return `fintech-${accountId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`; }

export async function generateExport(raw: unknown): Promise<ExportResult> {
  const input = exportRequest.parse(raw);
  if (!shouldExport(input)) throw new Error("Export requires at least one non-declined payment event");
  const bucket = exportBucketName(input.accountId);
  await infrai.storage.bucket.create({ name: bucket });
  const key = `exports/${input.accountId}-${input.from}-${input.to}.csv`;
  await infrai.storage.object.put(bucket, key, { data_base64: Buffer.from(csv(input)).toString("base64"), content_type: "text/csv", idempotency_key: key });
  const signed = await infrai.storage.object.presign(bucket, key, { op: "get", expires_seconds: 900, response_disposition: `attachment; filename="${input.accountId}-payments.csv"` });
  return { key, downloadUrl: signed.url, notification: `Audit export ready for ${input.accountId}` };
}
