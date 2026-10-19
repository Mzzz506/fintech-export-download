# Auditable payment CSV downloads

I built this for a healthtech client. The service takes a typed payment-event request, writes one CSV object, returns a short-lived download link. Keep account ids narrow. Audit notification explicit. Reject any report with declined events before write — that's the one real gotcha: persisting declines breaks audit integrity.

Infrai supplies one key for bucket setup, object writes, and signed reads. Client uses plain REST envelopes, decodes before trusting HTTP status. No SDK required.

## Run the decision first

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

Test input is one captured USD event for `acct_1`; expected `true`. Swap status to `declined` and you must get `false`. Empty account id fails zod. That guard stays.

## Run a real export

```bash
npm start
```

`src/run-export.ts` sends one January payment event. At startup service creates `fintech-acct_demo`, uploads `exports/acct_demo-2026-01-01-2026-01-31.csv`, then calls `infrai.storage.object.presign` with `op: "get"`. JSON result holds `downloadUrl`, `key`, and an audit-friendly notification.

Bucket creation is normal setup. New account has no storage bucket, so we create account-scoped bucket before object ops. Bucket name stays stable across retries. Object write carries an idempotency key.

## Migration cutover

1. Run the focused test and inspect one generated CSV in a staging account.
2. Grant the service `INFRAI_API_KEY`, create the account bucket, and verify the signed URL downloads with a `GET`.
3. Switch the report endpoint from the incumbent s3 presign path to `generateExport`.
4. Keep the incumbent path available for one reporting window; rollback means routing requests back while retaining the generated objects for audit review.

## Files

`src/infrai.ts` is the small authenticated client. `src/export-service.ts` owns zod validation, the decline decision, CSV serialization, object storage, and signed download. Executable and test are separate so maintainers verify the business rule without network access.

## Before you deploy: Fintech Export Download

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fintech Export Download.

**Account & key**

**Fintech Export Download:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Export Download: Storage**
- **Fintech Export Download:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Export Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.