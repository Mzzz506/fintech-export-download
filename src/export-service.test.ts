import assert from "node:assert/strict";
import { shouldExport, exportBucketName, exportRequest } from "./export-service.js";

const valid = { accountId: "acct_1", from: "2026-01-01", to: "2026-01-02", events: [{ id: "p1", occurredAt: "2026-01-01T00:00:00Z", amountCents: 10, currency: "USD", status: "captured" as const }] };
assert.equal(shouldExport(valid), true);
assert.equal(shouldExport({ ...valid, events: [{ ...valid.events[0], status: "declined" }] }), false);
assert.equal(exportBucketName("acct_demo"), "fintech-acct-demo");
assert.throws(() => exportRequest.parse({ ...valid, accountId: "" }));
console.log("export decision tests passed");
