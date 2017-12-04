'use strict'

const Code = require('code')
const Lab = require('lab')
const Request = require('request')
const Seneca = require('seneca')
const Web = require('seneca-web')
const Connect = require('connect')
const BodyParser = require('body-parser')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach

/**
 * todo: refactor these tests to not use `seneca-web` directly.
 * really we should stub out its responses into the defined api,
 * (options, context, auth, routes, done)
 */
describe('connect', () => {
  let si = null
  let app = null
  let server = null

  const middleware = {
    head: (req, res, next) => { res.writeHead(200, {'Content-Type': 'application/json'}); next() },
    res: (req, res, next) => res.end(JSON.stringify({success: true}))
  }

  beforeEach(done => {
    app = Connect()
    server = app.listen(3000, () => {
      si = Seneca({log: 'silent'})
      si.use(Web, {adapter: require('..'), context: app, middleware})
      si.ready(done)
    })
  })

  afterEach(done => {
    server.close(done)
  })

  it('by default routes autoreply', (done) => {
    var config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    si.add('role:test,cmd:ping', (msg, reply) => {
      reply(null, {res: 'pong!'})
    })

    si.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      Request('http://127.0.0.1:3000/ping', (err, res, body) => {
        if (err) return done(err)
        body = JSON.parse(body)
        expect(body).to.be.equal({res: 'pong!'})
        done()
      })
    })
  })

  it('multiple routes supported', (done) => {
    var config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          one: true,
          two: true
        }
      }
    }

    si.add('role:test,cmd:one', (msg, reply) => {
      reply(null, {res: 'pong!'})
    })

    si.add('role:test,cmd:two', (msg, reply) => {
      reply(null, {res: 'ping!'})
    })

    si.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      Request('http://127.0.0.1:3000/one', (err, res, body) => {
        if (err) return done(err)

        body = JSON.parse(body)

        expect(body).to.be.equal({res: 'pong!'})

        Request('http://127.0.0.1:3000/two', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)

          expect(body).to.be.equal({res: 'ping!'})
          done()
        })
      })
    })
  })

  it('post without body parser defined', (done) => {
    var config = {
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
      reply(null, {value: msg.args.body})
    })

    si.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      Request.post('http://127.0.0.1:3000/echo', {json: {foo: 'bar'}}, (err, res, body) => {
        if (err) return done(err)
        expect(body.value).to.be.equal('{"foo":"bar"}')
        done()
      })
    })
  })

  it('post with body parser defined', (done) => {
    var config = {
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

    si.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      Request.post('http://127.0.0.1:3000/echo', {json: {foo: 'bar'}}, (err, res, body) => {
        if (err) return done(err)
        expect(body).to.be.equal({foo: 'bar'})
        done()
      })
    })
  })

  it('can handle custom errors properly', (done) => {
    var config = {
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

    si.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      app.use((err, req, res, next) => {
        if (res.headersSent) { return next(err) }
        res.writeHead(400, {'Content-Type': 'application/json'})
        return res.end(JSON.stringify({message: err.orig.message.replace('gate-executor: ', '')}))
      })

      Request('http://127.0.0.1:3000/boom', (err, res, body) => {
        if (err) return done(err)
        body = JSON.parse(body)
        expect(res.statusCode).to.equal(400)
        expect(body).to.be.equal({message: 'aw snap!'})
        done()
      })
    })
  })

  describe('middleware', () => {
    it('blows up on invalid middleware input', done => {
      var config = {
        routes: {
          pin: 'role:test,cmd:*',
          middleware: ['total not valid'],
          map: {
            ping: true
          }
        }
      }
      si.act('role:web', config, (err, reply) => {
        expect(err.details.message).to.equal('expected valid middleware, got total not valid')
        done()
      })
    })
    it('should call middleware routes properly - passing as strings', done => {
      var config = {
        routes: {
          pin: 'role:test,cmd:*',
          middleware: ['head', 'res'],
          map: {
            ping: true
          }
        }
      }

      si.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {res: 'ping!'})
      })

      si.act('role:web', config, (err, reply) => {
        if (err) return done(err)
        Request('http://127.0.0.1:3000/ping', (err, res, body) => {
          if (err) return done(err)
          body = JSON.parse(body)
          expect(res.statusCode).to.equal(200)
          expect(body).to.be.equal({success: true})
          done()
        })
      })
    })
    it('should call middleware routes properly - passing as functions', done => {
      var config = {
        routes: {
          pin: 'role:test,cmd:*',
          map: {
            ping: true
          }
        }
      }

      si.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {res: 'ping!'})
      })

      si.add('role:web,routes:*', function (msg, cb) {
        msg.routes.middleware = [
          (req, res, next) => { res.writeHead(200, {'Content-Type': 'application/json'}); next() },
          (req, res, next) => res.end(JSON.stringify({success: true}))
        ]
        this.prior(msg, cb)
      })

      si.act('role:web', config, (err, reply) => {
        if (err) return done(err)
        Request('http://127.0.0.1:3000/ping', (err, res, body) => {
          if (err) return done(err)
          body = JSON.parse(body)
          expect(res.statusCode).to.equal(200)
          expect(body).to.be.equal({success: true})
          done()
        })
      })
    })
  })
})
