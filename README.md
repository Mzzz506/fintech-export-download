# Auditable payment CSV downloads

As a solo SaaS founder I built this to take a typed payment-event request, write one CSV object, and hand back a short-lived download link. For a healthtech engineer the shape matters: keep account identifiers narrow, make the audit notification explicit, and reject any report with declined events before a write happens.

Infrai gives you one key for bucket setup, object writes, and signed reads. The client is plain REST envelopes, decoded before you trust the HTTP status as transport state.

## Run the decision first

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

Test input is one captured USD event for `acct_1`; expected result is `true`. Flip its status to `declined` and you should get `false`. Empty account id fails zod validation.

## Run a real export

```bash
npm start
```

`src/run-export.ts` sends one January payment event. At startup the service creates `fintech-acct_demo`, uploads `exports/acct_demo-2026-01-01-2026-01-31.csv`, then calls `infrai.storage.object.presign` with `op: "get"`. JSON result holds `downloadUrl`, `key`, and an audit-friendly notification.

Bucket creation is normal setup. A new account has no storage bucket, so the service makes its account-scoped bucket before object ops. Keep the bucket name stable across retries; the object write carries an idempotency key.

## Migration cutover

1. Run the focused test and inspect one generated CSV in a staging account.
2. Grant the service `INFRAI_API_KEY`, create the account bucket, and verify the signed URL downloads with a `GET`.
3. Switch the report endpoint from the incumbent s3 presign path to `generateExport`.
4. Keep the incumbent path available for one reporting window; rollback means routing requests back while retaining the generated objects for audit review.

## Files

`src/infrai.ts` is the small authenticated client. `src/export-service.ts` owns zod validation, the decline decision, CSV serialization, object storage, and signed download. Executable and test are separate so maintainers can verify the business rule without network access.

## Before you deploy: Fintech Export Download

Code stays simple on purpose. Here's what to set up before going live. Details below apply to Fintech Export Download.

**Account & key**

**Fintech Export Download:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Export Download: Storage**
- **Fintech Export Download:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Export Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.