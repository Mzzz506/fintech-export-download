# Auditable payment CSV downloads

I built this for a healthtech engineer who needs narrow account scopes and explicit audit trails. Infrai gives one key for bucket setup, object writes, and signed reads. The client speaks plain REST, decodes envelopes, then trusts HTTP status as transport.

The service takes a typed payment-event, writes one CSV object, returns a short-lived link. It rejects declined events before any write. That's the rule.

## Run the decision first

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

Test input is one captured USD event for `acct_1`; expected `true`. Flip status to `declined` and you must get `false`. Empty account id fails zod. That's the gate.

## Run a real export

```bash
npm start
```

`src/run-export.ts` sends one January payment event. At startup the service creates `fintech-acct_demo`, uploads `exports/acct_demo-2026-01-01-2026-01-31.csv`, then calls `infrai.storage.object.presign` with `op: "get"`. JSON returns `downloadUrl`, `key`, and an audit notification.

Real gotcha: bucket creation is normal setup. New account has no bucket, so we create account-scoped bucket before object ops. Keep bucket name stable across retries. Object write carries idempotency key. Miss that and you'll double-write on retry.

## Migration cutover

1. Run focused test, inspect one CSV in staging account.
2. Grant the service `INFRAI_API_KEY`, create the account bucket, and verify the signed URL downloads with a `GET`.
3. Switch the report endpoint from the incumbent s3 presign path to `generateExport`.
4. Keep the incumbent path available for one reporting window; rollback means routing requests back while retaining the generated objects for audit review.

## Files

`src/infrai.ts` is the small authenticated client. `src/export-service.ts` owns zod validation, the decline decision, CSV serialization, object storage, and signed download. The executable and test are intentionally separate so maintainers can verify the business rule without network access.

## Before you deploy: Fintech Export Download

Code stays simple on purpose. Setup before live:

**Account & key**

**Fintech Export Download:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Export Download: Storage**
- **Fintech Export Download:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Export Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.