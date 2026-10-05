// In-memory stand-in for an ioredis client. The class name must stay `Redis`:
// the store detects ioredis by constructor name.
export class Redis {
  constructor() {
    this.data = new Map()
    this.writes = [] // keys touched by SET/DEL, in order
    this.execCount = 0
    this.faults = {} // get: { match }, exec: { mode, times }
    this.gate = null // when set, every EXEC waits for this promise first
  }

  fail(op, fault) {
    this.faults[op] = fault
  }

  heal() {
    this.faults = {}
  }

  getFault(op, key) {
    const fault = this.faults[op]
    if (!fault || (fault.match && !fault.match(key))) return null
    if (typeof fault.times === 'number') {
      if (fault.times <= 0) return null
      fault.times--
    }
    return fault
  }

  apply([cmd, key, value]) {
    this.writes.push(key)
    if (cmd === 'set') this.data.set(key, value)
    else this.data.delete(key)
  }

  async get(key) {
    if (this.getFault('get', key)) throw new Error('fake GET failure')
    return this.data.has(key) ? this.data.get(key) : null
  }

  async set(key, value) {
    this.apply(['set', key, value])
    return 'OK'
  }

  async setex(key, _ttl, value) {
    return this.set(key, value)
  }

  async del(...keys) {
    let n = 0
    for (const key of keys.flat()) {
      if (this.data.has(key)) n++
      this.apply(['del', key])
    }
    return n
  }

  multi() {
    return new Batch(this)
  }

  pipeline() {
    return new Batch(this)
  }
}

class Batch {
  constructor(redis) {
    this.redis = redis
    this.cmds = []
  }

  get(key) {
    this.cmds.push(['get', key])
    return this
  }

  set(key, value) {
    this.cmds.push(['set', key, value])
    return this
  }

  setex(key, _ttl, value) {
    return this.set(key, value)
  }

  del(key) {
    this.cmds.push(['del', key])
    return this
  }

  async exec() {
    const redis = this.redis
    redis.execCount++
    if (redis.gate) await redis.gate
    const fault = redis.getFault('exec')
    if (fault?.mode === 'throw') throw new Error('fake EXEC failure')
    if (fault?.mode === 'null') return null
    const results = this.cmds.map((cmd, i) => {
      if (fault?.mode === 'tupleError' && i === (fault.index ?? 0)) {
        return [new Error('fake command error'), null]
      }
      if (cmd[0] === 'get') return [null, redis.data.has(cmd[1]) ? redis.data.get(cmd[1]) : null]
      redis.apply(cmd)
      return [null, cmd[0] === 'del' ? 1 : 'OK']
    })
    if (fault?.mode === 'applyThenThrow') throw new Error('Command timed out')
    return results
  }
}

export const silentLogger = {
  level: 'silent',
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  child() {
    return silentLogger
  }
}
