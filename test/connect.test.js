'use strict'

const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert')
const Http = require('node:http')
const Seneca = require('seneca')
const Web = require('@seneca/web')
const Connect = require('connect')
const BodyParser = require('body-parser')

// Promise wrapper around seneca.act: the act callback carries the
// action's error unchanged.
function act(si, pattern, msg) {
  return new Promise((resolve, reject) =>
    si.act(pattern, msg, (err, out) => (err ? reject(err) : resolve(out)))
  )
}

function postJSON(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data)
  })
}

/**
 * todo: refactor these tests to not use `@seneca/web` directly.
 * really we should stub out its responses into the defined api,
 * (options, context, auth, routes, done)
 */
describe('connect', () => {
  let si = null
  let app = null
  let server = null
  let base = null

  const middleware = {
    head: (req, res, next) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      next()
    },
    res: (req, res) => res.end(JSON.stringify({ success: true }))
  }

  beforeEach(async () => {
    app = Connect()
    server = app.listen(0, '127.0.0.1')
    await new Promise(resolve => server.once('listening', resolve))
    base = 'http://127.0.0.1:' + server.address().port
    si = Seneca({ log: 'silent' })
    si.use(Web, { adapter: require('..'), context: app, middleware })
    await si.ready()
  })

  afterEach(async () => {
    await new Promise(resolve => server.close(resolve))
    await si.close()
  })

  it('by default routes autoreply', async () => {
    const config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    si.add('role:test,cmd:ping', (msg, reply) => {
      reply(null, { res: 'pong!' })
    })

    await act(si, 'role:web', config)

    const res = await fetch(base + '/ping')
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('content-type'), 'application/json')
    assert.deepEqual(await res.json(), { res: 'pong!' })
  })

  it('multiple routes supported', async () => {
    const config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          one: true,
          two: true
        }
      }
    }

    si.add('role:test,cmd:one', (msg, reply) => {
      reply(null, { res: 'pong!' })
    })

    si.add('role:test,cmd:two', (msg, reply) => {
      reply(null, { res: 'ping!' })
    })

    await act(si, 'role:web', config)

    let res = await fetch(base + '/one')
    assert.deepEqual(await res.json(), { res: 'pong!' })

    res = await fetch(base + '/two')
    assert.deepEqual(await res.json(), { res: 'ping!' })
  })

  it('passes the query string', async () => {
    const config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          echo: true
        }
      }
    }

    si.add('role:test,cmd:echo', (msg, reply) => {
      reply(null, { query: msg.args.query })
    })

    await act(si, 'role:web', config)

    let res = await fetch(base + '/echo?foo=bar&n=1&n=2&s=a%20b')
    assert.deepEqual(await res.json(), {
      query: { foo: 'bar', n: ['1', '2'], s: 'a b' }
    })

    res = await fetch(base + '/echo')
    assert.deepEqual(await res.json(), { query: {} })
  })

  it('reads the query of a target that is not a valid URL path', async () => {
    si.add('role:test,cmd:echo', (msg, reply) => {
      reply(null, { query: msg.args.query })
    })

    // A route at the root matches '//?foo=bar', which new URL() rejects as
    // a URL without a host. With parseBody the adapter reads the query in
    // the request's 'end' listener, where a throw would stop the server.
    const route = {
      path: '/',
      methods: ['GET'],
      pattern: 'role:test,cmd:echo',
      autoreply: true
    }
    await new Promise((resolve, reject) =>
      require('..').call(si, { parseBody: true }, app, null, [route], err =>
        err ? reject(err) : resolve()
      )
    )

    const res = await new Promise((resolve, reject) => {
      const req = Http.get(
        { host: '127.0.0.1', port: server.address().port, path: '//?foo=bar' },
        resolve
      )
      req.on('error', reject)
      req.setTimeout(5000, () => req.destroy(new Error('no response')))
    })
    let text = ''
    for await (const chunk of res) text += chunk
    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(text), { query: { foo: 'bar' } })
  })

  it('post without body parser defined', async () => {
    const config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          echo: {
            POST: true
          }
        }
      }
    }

    si.add('role:test,cmd:echo', (msg, reply) => {
      reply(null, { value: msg.args.body })
    })

    await act(si, 'role:web', config)

    const res = await postJSON(base + '/echo', { foo: 'bar' })
    const body = await res.json()
    assert.equal(body.value, '{"foo":"bar"}')
  })

  it('post with body parser defined', async () => {
    const config = {
      options: {
        parseBody: false
      },
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          echo: {
            POST: true
          }
        }
      }
    }

    app.use(BodyParser.json())

    si.add('role:test,cmd:echo', (msg, reply) => {
      reply(null, msg.args.body)
    })

    await act(si, 'role:web', config)

    const res = await postJSON(base + '/echo', { foo: 'bar' })
    assert.deepEqual(await res.json(), { foo: 'bar' })
  })

  it('can handle custom errors properly', async () => {
    const config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          boom: true
        }
      }
    }

    si.add('role:test,cmd:boom', (msg, reply) => {
      reply(new Error('aw snap!'))
    })

    await act(si, 'role:web', config)

    // The adapter hands the action error to Connect via next(err).
    // Seneca 4 passes the action's error through unchanged.
    app.use((err, req, res, next) => {
      if (res.headersSent) {
        return next(err)
      }
      res.writeHead(400, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ message: err.message }))
    })

    const res = await fetch(base + '/boom')
    assert.equal(res.status, 400)
    assert.deepEqual(await res.json(), { message: 'aw snap!' })
  })

  it('fails without a context', () => {
    let result = null
    require('..').call(si, { parseBody: true }, null, null, [], (err, out) => {
      result = { err, out }
    })
    assert.equal(result.err.message, 'no context provided')
    assert.equal(result.out, undefined)
  })

  describe('middleware', () => {
    it('blows up on invalid middleware input', async () => {
      const config = {
        routes: {
          pin: 'role:test,cmd:*',
          middleware: ['total not valid'],
          map: {
            ping: true
          }
        }
      }

      await assert.rejects(act(si, 'role:web', config), {
        message: 'expected valid middleware, got total not valid'
      })
    })

    it('should call middleware routes properly - passing as strings', async () => {
      const config = {
        routes: {
          pin: 'role:test,cmd:*',
          middleware: ['head', 'res'],
          map: {
            ping: true
          }
        }
      }

      si.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, { res: 'ping!' })
      })

      await act(si, 'role:web', config)

      const res = await fetch(base + '/ping')
      assert.equal(res.status, 200)
      assert.deepEqual(await res.json(), { success: true })
    })

    it('should call middleware routes properly - passing as functions', async () => {
      const config = {
        routes: {
          pin: 'role:test,cmd:*',
          map: {
            ping: true
          }
        }
      }

      si.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, { res: 'ping!' })
      })

      si.add('role:web,routes:*', function(msg, cb) {
        msg.routes.middleware = [
          (req, res, next) => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            next()
          },
          (req, res) => res.end(JSON.stringify({ success: true }))
        ]
        this.prior(msg, cb)
      })

      await act(si, 'role:web', config)

      const res = await fetch(base + '/ping')
      assert.equal(res.status, 200)
      assert.deepEqual(await res.json(), { success: true })
    })

    it('passes middleware errors to connect', async () => {
      const config = {
        routes: {
          pin: 'role:test,cmd:*',
          middleware: ['fail'],
          map: {
            ping: true
          }
        },
        options: {
          parseBody: true,
          middleware: {
            fail: (req, res, next) => next(new Error('middleware failed'))
          }
        }
      }

      si.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, { res: 'ping!' })
      })

      await act(si, 'role:web', config)

      app.use((err, req, res, next) => {
        if (res.headersSent) {
          return next(err)
        }
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: err.message }))
      })

      const res = await fetch(base + '/ping')
      assert.equal(res.status, 500)
      assert.deepEqual(await res.json(), { message: 'middleware failed' })
    })
  })
})
