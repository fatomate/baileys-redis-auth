# Redis Auth State V2 – Baileys v7.0.0-rc.6 Compatibility Plan

## 1. Auth-State Requirements Introduced in Baileys v7 RC6

| Area | v7 Expectations | Source |
| --- | --- | --- |
| **Signal data buckets** | `SignalDataTypeMap` now includes `sender-key-memory`, `lid-mapping`, and `device-list` in addition to the legacy `session`, `pre-key`, `sender-key`, `app-state-sync-*`. `AuthenticationCreds` gained `routingInfo` and `additionalData`. | `Baileys-7.0.0-rc.6/src/Types/Auth.ts:60-114` |
| **Transactional semantics** | All external key stores are wrapped with `addTransactionCapability` and Baileys calls `keys.transaction(work, scopeKey)` per operation. The store must tolerate nested reads/writes and commit the aggregated `SignalDataSet` atomically. | `Baileys-7.0.0-rc.6/src/Socket/socket.ts:322-334`, `src/Utils/auth-utils.ts:114-260` |
| **Device index tracking** | After a USync fetch, Baileys executes `authState.keys.set({ 'device-list': userDeviceUpdates })` where each entry is an array of device IDs per bare user. Later migrations read the same keys verbatim. | `Baileys-7.0.0-rc.6/src/Socket/messages-send.ts:300-369` |
| **Sender key memory lifecycle** | When libsignal needs to fan-out new sender keys (e.g. after retries), Baileys deletes `sender-key-memory` entries by writing `null`. Stores must treat `null` as a hard delete, otherwise stale recipients remain suppressed. | `Baileys-7.0.0-rc.6/src/Socket/messages-recv.ts:975-1000` |
| **LID mapping ownership** | The new `LIDMappingStore` persists PN↔LID relationships exclusively through `auth.keys`. Mappings are stored as `{ [pnUser]: lidUser, [lidUser_reverse]: pnUser }` inside a transaction. | `Baileys-7.0.0-rc.6/src/Signal/lid-mapping.ts:27-170` |

## 2. Current Redis Auth (v1.2.0) Snapshot

- `useRedisAuthState` exposes a hand-rolled `{ state, saveCreds }` built around manual pipelines, custom serialization (`fastSerialize`/`fastDeserialize`), optional connection pooling, and aggressive variant expansion for every key (`src/redis-auth-state.ts:407-1050`).
- LID handling is implemented via bespoke Redis keys (`lid:` / `lid:reverse:`) managed by `lid-handler.ts`. Those keys are independent of Baileys’ `lid-mapping` dataset and are used to mirror session entries across PN/LID formats (`src/lid-handler.ts:11-330`).
- Variant expansion duplicates every `set` operation across bare numbers, suffixed forms, and alternating domains via `queueVariantOperations`, regardless of key category (`src/redis-auth-state.ts:551-621, 978-1040`).
- `BatchOperationManager`/connection pool classes exist but the batch manager is instantiated and never referenced afterwards (`src/redis-auth-state.ts:468-472`).
- Package metadata still peers on `baileys >= 6.0.0` and the README/examples do not mention the v7 auth changes (`package.json:34-36`).

## 3. Gaps vs v7 RC6 Requirements

| Requirement | Current Behaviour | Impact | Change Needed in V2 |
| --- | --- | --- | --- |
| Typed `SignalKeyStore` | `state.keys` is typed as `any`; `types.ts` never references Baileys’ auth types. (`src/redis-auth-state.ts:407`, `src/types.ts`) | Cannot rely on TS to enforce support for new buckets; risk of silent omissions. | Import `AuthenticationState`, `SignalDataTypeMap`, `SignalKeyStore` from Baileys v7; type `state` and `keys` accordingly so the compiler forces exhaustive handling. |
| Canonical LID mapping | LID cache lives outside `SignalDataTypeMap` in custom Redis keys; lazy/opportunistic writes also use the bespoke store. (`src/lid-handler.ts`) | Diverges from Baileys’ `lid-mapping` semantics; duplicate writes cause race conditions and extra load. | Treat Baileys’ `'lid-mapping'` entries as the source of truth. Rework `lid-handler` helpers to read/write via `state.keys` (or mirror the dataset) and gate the legacy store behind a v6 compatibility flag. |
| Device list persistence | Variant expansion writes dozens of `device-list` entries per user even though Baileys only reads bare numeric IDs. | Unnecessary Redis churn and storage bloat; TTL handling likely wrong (device lists should persist even if session TTL is set). | Limit variant expansion to `category === 'session'`. Store `'device-list'` entries exactly as Baileys writes them and introduce per-type TTL overrides (default: no expiry). |
| Sender-key deletions | Deletes only affect the literal key provided; variant duplicates keep stale booleans. | Sender-key fan-outs remain “blocked” because faux variants still claim the key was sent. | Track written variants per key and delete them all when payload is `null`, or simply avoid variant expansion for non-session categories. |
| Transactions / batching | `BatchOperationManager` is unused; each `get`/`set` still launches its own pipeline, and pooled connections are never released. | Higher v7 traffic (device lists, lid mappings) will increase RTTs and risk connection exhaustion. | Either wire the manager into `bulkRead`/`bulkWrite` or replace with a simpler batching queue; release Redis clients after use or expose a `close()` helper. |
| Packaging & docs | `peerDependencies.baileys` still `>=6.0.0`; README describes only v6 flows. | No install-time signal that users need Baileys v7; docs mislead integrators. | Update peer dependency to `^7.0.0`, bump engines to Node ≥20, document new behaviour/options. |

## 4. Redis Auth V2 Action Plan

### 4.1 Adopt Baileys v7 types end-to-end
- Pull the official auth types:
  ```ts
  import type {
    AuthenticationState,
    SignalDataSet,
    SignalDataTypeMap,
    SignalKeyStore
  } from 'baileys'
  ```
- Return `Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }>` from `useRedisAuthState` and ensure `keys` satisfies `SignalKeyStore`.
- Extend `toAppStateSyncValue` to handle `'app-state-sync-key'` (already) and ensure arrays (for `'device-list'`) and simple strings (for `'lid-mapping'`) are decoded without mutation.

### 4.2 Align LID handling with Baileys’ `lid-mapping`
- Surface a helper that translates the legacy LID utilities to Baileys’ dataset:
  ```ts
  await state.keys.set({ 'lid-mapping': { [pnUser]: lidUser, [`${lidUser}_reverse`]: pnUser } })
  ```
- When lazy/opportunistic writes discover PN⇄LID pairs, update `'lid-mapping'` instead of writing `lid:` keys.
- Keep the bespoke Redis cache behind a new option (`legacyLidCache?: boolean`, default false) so v6 clients can opt in while v7 uses the canonical store.

### 4.3 Correct handling for `device-list` & `sender-key-memory`
- Restrict variant expansion:
  ```ts
  const shouldExpand = enableLidSupport && category === 'session'
  const variants = shouldExpand ? expandKeyVariants(idValue) : [idValue]
  ```
- Introduce `perTypeTTL` in `RedisAuthStateOptions` to allow device lists to persist even if session TTLs are short.
- Maintain a per-key index (e.g. `writtenVariants:${category}:${id}`) so when payload is `null` we delete every variant we previously emitted.

### 4.4 Honour transaction/backpressure expectations
- Wire the existing `BatchOperationManager` into `bulkRead`/`bulkWrite`, or replace it with a queue that groups operations per microtask.
- Release connections borrowed from `RedisConnectionPool` when the auth state is disposed (return `pool?.releaseConnection(redis)` once the caller is done, or expose `close()` in the returned object).

### 4.5 Packaging & documentation
- Update `package.json`:
  ```json
  "peerDependencies": { "baileys": "^7.0.0" },
  "engines": { "node": ">=20.0.0" }
  ```
- Refresh README/examples to highlight Baileys v7 usage, the new key buckets, and options like `perTypeTTL`, `legacyLidCache`, `enableDeviceListCaching`.
- Add logging around the new flows (device list writes, lid-mapping updates) under the existing `enableLog` flag.

Implementing the above in Redis Auth State V2 ensures full compatibility with Baileys v7 RC6: transactions remain safe, new Signal keys are stored exactly as Baileys expects, LID mapping follows the canonical dataset, and device-index keys are persisted without redundant duplication.
