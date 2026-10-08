import { generateExport } from "./export-service.js";

const result = await generateExport({ accountId: "acct_demo", from: "2026-01-01", to: "2026-01-31", events: [{ id: "pay_001", occurredAt: "2026-01-12T10:00:00Z", amountCents: 1250, currency: "USD", status: "captured" }] });
console.log(JSON.stringify(result, null, 2));
