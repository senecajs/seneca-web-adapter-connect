'use strict'

const _ = require('lodash')
const QueryString = require('querystring')
const URL = require('url')
const ReadBody = require('./read-body')

module.exports = function connect (options, context, auth, routes, done) {
  const seneca = this

  // middleware is an object with keys defining middleware
  const middleware = options.middleware
  if (!context) {
    return done(new Error('no context provided'))
  }

  _.each(routes, (route) => {
    // pull out middleware from the route; map strings to options' middleware.
    // if we don't get a function, blow up hard - this is a user-code problem.
    const routeMiddleware = (route.middleware || []).map(_middleware => {
      const ret = _.isString(_middleware) ? middleware[_middleware] : _middleware
      if (!_.isFunction(ret)) {
        throw new Error(`expected valid middleware, got ${_middleware}`)
      }
      return ret
    })

    context.use(route.path, composeMiddleware(routeMiddleware.concat([(request, reply, next) => {
      // Connect does not work with http verbs
      if (route.methods.indexOf(request.method) !== -1) {
        // if parsing body, call into ReadBody otherwise just finish.
        if (options.parseBody) { return ReadBody(request, finish) }
        finish(null, request.body || {})
      }

      function finish (err, body) {
        if (err) {
          return next(err)
        }

        var payload = {
          request$: request,
          response$: reply,
          args: {
            body: body,
            route: route,
            query: QueryString.parse(URL.parse(request.originalUrl).query)
          }
        }
        seneca.act(route.pattern, payload, (err, response) => {
          if (err) {
            return next(err)
          }
          if (route.autoreply) {
            reply.writeHead(200, {'Content-Type': 'application/json'})
            reply.end(JSON.stringify(response))
          }
        })
      }
    }])))
  })
  return done(null, {routes: routes})
}

/**
 * Composes an array of middleware functions,
 * Ensures each is called correctly in the proper order prior to invoking the last one.
 * @param {function[]} _middleware middleware to compose
 */
const composeMiddleware = _middleware => {
  return _middleware.reduce((previous, current) => {
    return (req, res, next) => {
      previous(req, res, (err) => {
        if (err) { return next(err) }
        current(req, res, next)
      })
    }
  })
}
