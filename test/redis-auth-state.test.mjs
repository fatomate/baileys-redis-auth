// WAB-819 regressions (R*) and compatibility coverage (C*) for the Redis auth store.
// Runs against the built lib/ with an in-memory ioredis stand-in and real Baileys rc14.
import test from 'node:test'
import assert from 'node:assert/strict'
import { addTransactionCapability, Curve, initAuthCreds, makeCacheableSignalKeyStore, proto, signedKeyPair } from 'baileys'
import { makeLibSignalRepository } from 'baileys/lib/Signal/libsignal.js'
import * as store from '../lib/index.js'
import { Redis, silentLogger } from './fake-redis.mjs'

const PREFIX = 'baileys:auth:'
let counter = 0
const newSession = () => `wab819-${++counter}`

const open = (redis, sessionId) =>
  store.useRedisAuthState({ redis, keyPrefix: PREFIX, sessionId, enableCache: false })

const keyOf = (sessionId, type, id) => `${PREFIX}${sessionId}:${type}-${id}`

// The pre-fix decoder, kept verbatim in behaviour, to prove old processes can read new writes.
const oldDecode = (raw) =>
  JSON.parse(raw, (_k, v) => (v !== null && typeof v === 'object' && v.type === 'Buffer' ? Buffer.from(v.data) : v))

const bytes = (n, seed = 1) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + seed) % 256)

const flush = () => new Promise((resolve) => setImmediate(resolve))

// rc14 compares identity keys this way in signalStorage.saveIdentity.
const sameIdentity = (existing, incoming) =>
  existing?.length === incoming.length && existing.every((b, i) => b === incoming[i])

async function rejectsWithAuthStoreCode(promise) {
  await assert.rejects(promise, (err) => err?.code === 'AUTH_STORE_UNAVAILABLE')
}

// ---------------------------------------------------------------------------
// R1 — device and domain isolation
// ---------------------------------------------------------------------------

for (const [label, dev0, devN] of [
  ['PN', '60111.0', '60111.5'],
  ['LID', '12345_1.0', '12345_1.5']
]) {
  test(`R1 ${label}: writing device N leaves device 0 unchanged`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const { state } = await open(redis, sid)
    await state.keys.set({ session: { [dev0]: { owner: 'device-0' } } })
    await state.keys.set({ session: { [devN]: { owner: 'device-N' } } })
    const got = await state.keys.get('session', [dev0])
    assert.deepEqual(got[dev0], { owner: 'device-0' })
  })

  test(`R1 ${label}: one batch keeps both device N and device 0`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const { state } = await open(redis, sid)
    await state.keys.set({ session: { [devN]: { owner: 'device-N' }, [dev0]: { owner: 'device-0' } } })
    const got = await state.keys.get('session', [dev0, devN])
    assert.deepEqual(got[dev0], { owner: 'device-0' })
    assert.deepEqual(got[devN], { owner: 'device-N' })
  })

  test(`R1 ${label}: get for a device with no session returns null`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const { state } = await open(redis, sid)
    await state.keys.set({ session: { [dev0]: { owner: 'device-0' } } })
    const missing = devN.replace(/\.\d+$/, '.9')
    const got = await state.keys.get('session', [missing])
    assert.equal(got[missing] ?? null, null)
  })

  test(`R1 ${label}: deleting device N keeps device 0`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const { state } = await open(redis, sid)
    await state.keys.set({ session: { [dev0]: { owner: 'device-0' } } })
    await state.keys.set({ session: { [devN]: { owner: 'device-N' } } })
    await state.keys.set({ session: { [devN]: null } })
    assert.ok(redis.data.has(keyOf(sid, 'session', dev0)), 'device 0 session must survive')
  })
}

test('R1 PN and LID sessions for the same user number stay separate', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { state } = await open(redis, sid)
  await state.keys.set({ session: { '60111.3': { owner: 'pn' } } })
  const got = await state.keys.get('session', ['60111_1.3'])
  assert.equal(got['60111_1.3'] ?? null, null)
})

for (const id of ['60111.0', '60111.5', '12345_1.3', '60111_128.99', '12345_129.99']) {
  test(`R1 exactly one Redis key is written for session ${id}`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const { state } = await open(redis, sid)
    redis.writes = []
    await state.keys.set({ session: { [id]: { owner: id } } })
    assert.deepEqual(redis.writes, [keyOf(sid, 'session', id)])
  })
}

const signalPub = (key) => Buffer.concat([Buffer.from([5]), key])
const prekeyBundle = () => {
  const identity = Curve.generateKeyPair()
  const signed = signedKeyPair(identity, 1)
  const preKey = Curve.generateKeyPair()
  return {
    registrationId: 4321,
    identityKey: signalPub(identity.public),
    signedPreKey: { keyId: 1, publicKey: signalPub(signed.keyPair.public), signature: signed.signature },
    preKey: { keyId: 7, publicKey: signalPub(preKey.public) }
  }
}

test('R1 real rc14 repository: sessions, PN→LID migration and delete stay per device', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { state } = await open(redis, sid)
  const keys = addTransactionCapability(state.keys, silentLogger, { maxCommitRetries: 2, delayBetweenTriesMs: 1 })
  const repo = makeLibSignalRepository({ creds: state.creds, keys }, silentLogger)

  await repo.injectE2ESession({ jid: '60111@s.whatsapp.net', session: prekeyBundle() })
  const device0Before = redis.data.get(keyOf(sid, 'session', '60111.0'))
  await repo.injectE2ESession({ jid: '60111:2@s.whatsapp.net', session: prekeyBundle() })
  assert.equal(redis.data.get(keyOf(sid, 'session', '60111.0')), device0Before, 'device 2 must not overwrite device 0')

  await keys.set({ 'device-list': { 60111: ['0', '2'] } })
  await repo.migrateSession('60111:2@s.whatsapp.net', '99999@lid')
  assert.equal((await repo.validateSession('99999:2@lid')).exists, true)
  assert.equal((await repo.validateSession('99999@lid')).exists, true)
  assert.equal((await repo.validateSession('60111:2@s.whatsapp.net')).exists, false)

  await repo.deleteSession(['99999:2@lid'])
  assert.equal((await repo.validateSession('99999:2@lid')).exists, false)
  assert.equal((await repo.validateSession('99999@lid')).exists, true, 'deleting device 2 must keep device 0')
})

// ---------------------------------------------------------------------------
// R2 / R3 — binary serialization and legacy identity keys
// ---------------------------------------------------------------------------

test('R2 Uint8Array identity keys (including subarrays) round-trip through a fresh store', async () => {
  const redis = new Redis()
  const sid = newSession()
  const plain = bytes(33)
  const view = bytes(40, 3).subarray(4, 37)
  const writer = await open(redis, sid)
  await writer.state.keys.set({ 'identity-key': { 'a.0': plain, 'b.0': view } })

  const reader = await open(redis, sid)
  const got = await reader.state.keys.get('identity-key', ['a.0', 'b.0'])
  assert.ok(sameIdentity(got['a.0'], plain))
  assert.ok(sameIdentity(got['b.0'], view))
  assert.deepEqual(JSON.parse(redis.data.get(keyOf(sid, 'identity-key', 'a.0'))), {
    type: 'Buffer',
    data: Array.from(plain)
  })
})

test('R3 legacy byte-object identity key reads back as 33 bytes rc14 can compare', async () => {
  const redis = new Redis()
  const sid = newSession()
  const legacy = bytes(33, 9)
  redis.data.set(keyOf(sid, 'identity-key', 'c.0'), JSON.stringify({ ...legacy }))
  const { state } = await open(redis, sid)
  const got = await state.keys.get('identity-key', ['c.0'])
  assert.equal(got['c.0'].length, 33)
  assert.ok(sameIdentity(got['c.0'], legacy))
})

const notLegacyShapes = {
  empty: {},
  sparse: { 0: 1, 2: 3 },
  extraProperty: { ...bytes(33), note: 'x' },
  fraction: { ...bytes(32), 32: 1.5 },
  outOfRange: { ...bytes(32), 32: 256 },
  wrongLength: { ...bytes(32) }
}

for (const [name, value] of Object.entries(notLegacyShapes)) {
  test(`R3 identity-key shape "${name}" is returned unchanged`, async () => {
    const redis = new Redis()
    const sid = newSession()
    redis.data.set(keyOf(sid, 'identity-key', 'd.0'), JSON.stringify(value))
    const { state } = await open(redis, sid)
    const got = await state.keys.get('identity-key', ['d.0'])
    assert.deepEqual(got['d.0'], JSON.parse(JSON.stringify(value)))
  })
}

test('R3 numeric-key objects in other families are returned unchanged', async () => {
  const redis = new Redis()
  const sid = newSession()
  const sessionValue = { ...bytes(33) }
  redis.data.set(keyOf(sid, 'session', 'e.0'), JSON.stringify(sessionValue))
  const { state } = await open(redis, sid)
  const got = await state.keys.get('session', ['e.0'])
  assert.deepEqual(got['e.0'], JSON.parse(JSON.stringify(sessionValue)))
})

// ---------------------------------------------------------------------------
// R4 — checked, single-MULTI writes
// ---------------------------------------------------------------------------

test('R4 keys.set rejects when any EXEC result is an error tuple', async () => {
  const redis = new Redis()
  const { state } = await open(redis, newSession())
  redis.fail('exec', { mode: 'tupleError', index: 1 })
  await assert.rejects(state.keys.set({ 'pre-key': { 1: { public: bytes(32) }, 2: { public: bytes(32) } } }))
})

test('R4 keys.set rejects when EXEC returns null', async () => {
  const redis = new Redis()
  const { state } = await open(redis, newSession())
  redis.fail('exec', { mode: 'null' })
  await assert.rejects(state.keys.set({ 'pre-key': { 1: { public: bytes(32) } } }))
})

test('R4 one keys.set call is one MULTI, even for ~812 pre-keys', async () => {
  const redis = new Redis()
  const { state } = await open(redis, newSession())
  const preKeys = Object.fromEntries(Array.from({ length: 812 }, (_, i) => [i + 1, { public: bytes(32, i) }]))
  redis.execCount = 0
  await state.keys.set({ 'pre-key': preKeys })
  assert.equal(redis.execCount, 1)
})

test('R4 retrying the same mutation set after a failure converges', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { state } = await open(redis, sid)
  const mutation = { 'pre-key': { 1: { public: bytes(32) }, 2: null } }
  redis.data.set(keyOf(sid, 'pre-key', '2'), '"old"')
  redis.fail('exec', { mode: 'tupleError', index: 0, times: 1 })
  await assert.rejects(state.keys.set(mutation))
  await state.keys.set(mutation)
  assert.ok(redis.data.has(keyOf(sid, 'pre-key', '1')))
  assert.ok(!redis.data.has(keyOf(sid, 'pre-key', '2')))
})

// ---------------------------------------------------------------------------
// R5 — fail-closed reads
// ---------------------------------------------------------------------------

test('R5 a failed creds read rejects with AUTH_STORE_UNAVAILABLE and writes nothing', async () => {
  const redis = new Redis()
  const sid = newSession()
  redis.fail('get', { match: (key) => key.endsWith(':creds') })
  await rejectsWithAuthStoreCode(open(redis, sid))
  assert.deepEqual(redis.writes, [])
})

for (const [name, raw] of Object.entries({
  jsonNull: 'null',
  emptyString: '',
  invalidJson: '{',
  missingFields: '{"foo":1}'
})) {
  test(`R5 stored creds "${name}" rejects instead of minting new creds`, async () => {
    const redis = new Redis()
    const sid = newSession()
    redis.data.set(`${PREFIX}${sid}:creds`, raw)
    await rejectsWithAuthStoreCode(open(redis, sid))
    assert.equal(redis.data.get(`${PREFIX}${sid}:creds`), raw)
  })
}

// Stored creds use the same array-form Buffer JSON that the store writes.
const storedCreds = (mutate = () => {}) => {
  const creds = JSON.parse(JSON.stringify(initAuthCreds()))
  mutate(creds)
  return JSON.stringify(creds)
}

test('R5 valid existing creds load unchanged and are not rewritten', async () => {
  const redis = new Redis()
  const sid = newSession()
  const raw = storedCreds()
  redis.data.set(`${PREFIX}${sid}:creds`, raw)
  const { state } = await open(redis, sid)
  assert.deepEqual(JSON.parse(JSON.stringify(state.creds)), JSON.parse(raw))
  assert.deepEqual(redis.writes, [])
})

for (const [name, mutate] of Object.entries({
  booleanNoisePublic: (c) => { c.noiseKey.public = true },
  stringIdentityPrivate: (c) => { c.signedIdentityKey.private = 'secret' },
  emptyNoisePrivate: (c) => { c.noiseKey.private = { type: 'Buffer', data: [] } },
  shortIdentityPublic: (c) => { c.signedIdentityKey.public = { type: 'Buffer', data: [1, 2, 3] } },
  negativeRegistrationId: (c) => { c.registrationId = -1 }
})) {
  test(`R5 stored creds with ${name} rejects without rewriting creds`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const raw = storedCreds(mutate)
    redis.data.set(`${PREFIX}${sid}:creds`, raw)
    await rejectsWithAuthStoreCode(open(redis, sid))
    assert.equal(redis.data.get(`${PREFIX}${sid}:creds`), raw)
    assert.deepEqual(redis.writes, [])
  })
}

test('R5 an undefined creds reply rejects instead of starting a new pairing', async () => {
  const redis = new Redis()
  const sid = newSession()
  redis.get = async () => undefined
  await rejectsWithAuthStoreCode(open(redis, sid))
  assert.deepEqual(redis.writes, [])
})

for (const [name, fault] of Object.entries({
  thrown: { mode: 'throw' },
  tupleError: { mode: 'tupleError', index: 0 },
  nullExec: { mode: 'null' }
})) {
  test(`R5 keys.get rejects on a ${name} read instead of returning null`, async () => {
    const redis = new Redis()
    const sid = newSession()
    const { state } = await open(redis, sid)
    redis.data.set(keyOf(sid, 'pre-key', '1'), JSON.stringify({ public: { type: 'Buffer', data: [1] } }))
    redis.fail('exec', fault)
    await assert.rejects(state.keys.get('pre-key', ['1']))
  })
}

// ---------------------------------------------------------------------------
// R6 — reads never write; writes touch only the exact keys
// ---------------------------------------------------------------------------

test('R6 keys.get issues no writes', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { state } = await open(redis, sid)
  redis.data.set(keyOf(sid, 'session', '60111.0'), JSON.stringify({ owner: 'device-0' }))
  redis.writes = []
  await state.keys.get('session', ['60111.4', '60111_1.4'])
  await flush()
  assert.deepEqual(redis.writes, [])
})

test('R6 a session write with a known LID mapping writes no lid:* keys', async () => {
  const redis = new Redis()
  const sid = newSession()
  redis.data.set(`${PREFIX}lid:${sid}:60111@lid`, '60111@s.whatsapp.net')
  redis.data.set(`${PREFIX}lid:reverse:${sid}:60111@s.whatsapp.net`, '60111@lid')
  const { state } = await open(redis, sid)
  redis.writes = []
  await state.keys.set({ session: { '60111.3': { owner: 'device-3' } } })
  await flush()
  assert.deepEqual(redis.writes, [keyOf(sid, 'session', '60111.3')])
})

// ---------------------------------------------------------------------------
// R7 — composed store: Baileys cache + transactions + withCacheRollback
// ---------------------------------------------------------------------------

async function composed(redis, sid) {
  const { state } = await open(redis, sid)
  const keys = store.withCacheRollback(makeCacheableSignalKeyStore(state.keys, silentLogger))
  const tx = addTransactionCapability(keys, silentLogger, { maxCommitRetries: 2, delayBetweenTriesMs: 1 })
  return { keys, tx }
}

test('R7 after an exhausted commit, reads return the persisted value', async () => {
  const redis = new Redis()
  const { tx } = await composed(redis, newSession())
  await tx.set({ session: { 'u.1': { v: 'persisted' } } })
  redis.fail('exec', { mode: 'throw' })
  await assert.rejects(tx.transaction(() => tx.set({ session: { 'u.1': { v: 'failed' } } }), 'k'))
  redis.heal()
  const got = await tx.get('session', ['u.1'])
  assert.deepEqual(got['u.1'], { v: 'persisted' })
})

test('R7 a read queued during a failing write returns the persisted value', async () => {
  const redis = new Redis()
  const { keys } = await composed(redis, newSession())
  await keys.set({ session: { 'u.1': { v: 'persisted' } } })
  let open_
  redis.gate = new Promise((resolve) => (open_ = resolve))
  redis.fail('exec', { mode: 'throw', times: 1 })
  const write = keys.set({ session: { 'u.1': { v: 'failed' } } })
  const read = keys.get('session', ['u.1'])
  open_()
  redis.gate = null
  await assert.rejects(write)
  assert.deepEqual((await read)['u.1'], { v: 'persisted' })
})

test('R7 a timeout after the server applied the write converges on retry', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { tx } = await composed(redis, sid)
  redis.fail('exec', { mode: 'applyThenThrow', times: 1 })
  await tx.transaction(() => tx.set({ session: { 'u.1': { v: 'new' } } }), 'k')
  assert.deepEqual((await tx.get('session', ['u.1']))['u.1'], { v: 'new' })
  assert.deepEqual(JSON.parse(redis.data.get(keyOf(sid, 'session', 'u.1'))), { v: 'new' })
})

// ---------------------------------------------------------------------------
// C1 / C2 — compatibility (may already pass on the base)
// ---------------------------------------------------------------------------

test('C1 values written by the store decode with the pre-fix decoder', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { state } = await open(redis, sid)
  const priv = Buffer.from(bytes(32, 5))
  await state.keys.set({ 'pre-key': { 1: { private: priv, public: Buffer.from(bytes(32, 6)) } } })
  const decoded = oldDecode(redis.data.get(keyOf(sid, 'pre-key', '1')))
  assert.ok(Buffer.isBuffer(decoded.private) && decoded.private.equals(priv))
})

test('C1 app-state-sync-key still reads back as a protobuf with its key bytes', async () => {
  const redis = new Redis()
  const sid = newSession()
  const { state } = await open(redis, sid)
  const keyData = Buffer.from(bytes(32, 11))
  await state.keys.set({
    'app-state-sync-key': { AAAA: { keyData, fingerprint: { rawId: 1, currentIndex: 0, deviceIndexes: [0] }, timestamp: 1 } }
  })
  const reader = await open(redis, sid)
  const got = (await reader.state.keys.get('app-state-sync-key', ['AAAA'])).AAAA
  assert.ok(got instanceof proto.Message.AppStateSyncKeyData)
  assert.ok(Buffer.from(got.keyData).equals(keyData))
})

test('C2 a truly missing creds key still starts a new pairing', async () => {
  const redis = new Redis()
  const { state } = await open(redis, newSession())
  const fresh = initAuthCreds()
  assert.equal(typeof state.creds.registrationId, 'number')
  assert.ok(state.creds.noiseKey?.public && state.creds.signedIdentityKey?.public)
  assert.equal(Object.keys(state.creds).sort().join(), Object.keys(fresh).sort().join())
})
