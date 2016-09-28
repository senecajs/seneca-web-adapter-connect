# Seneca Web Adapter Connect

[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]

This is an adapter for [seneca-web](https://github.com/senecajs/seneca-web/) using connect.

## Installation

Peer dependencies have been specified for `connect`, and `seneca-web`
They need to be present for this to work at all.

```
npm install --save connect
npm install --save seneca-web
npm install --save seneca-web-adapter-connect
```

## Usage

Please refer to the seneca-web documentation on how to load routes.

You can require this module as the adapter when using the SenecaWeb plugin

```js
const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Connect = require('connect')
const seneca = Seneca()
seneca.use(SenecaWeb, {
  context: Connect(),
  adapter: require('seneca-web-adapter-connect')
})
seneca.ready(() => {
  const app = seneca.export('web/context')()
  app.listen(3000)
})
```

[travis-badge]: https://travis-ci.org/senecajs/seneca-web-adapter-connect.svg?branch=master
[travis-url]: https://travis-ci.org/senecajs/seneca-web-adapter-connect
[coveralls-badge]: https://coveralls.io/repos/github/senecajs/seneca-web-adapter-connect/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-web-adapter-connect?branch=master
