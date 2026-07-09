![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/web-adapter-connect

[![npm version](https://img.shields.io/npm/v/seneca-web-adapter-connect.svg)](https://npmjs.com/package/seneca-web-adapter-connect)
[![build](https://github.com/senecajs/seneca-web-adapter-connect/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-web-adapter-connect/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-web-adapter-connect/badge.svg)](https://snyk.io/test/github/senecajs/seneca-web-adapter-connect)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-web-adapter-connect/badge.svg?branch=master)](https://coveralls.io/github/senecajs/seneca-web-adapter-connect?branch=master)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

A peer dependency has been specified for `seneca-web`. `connect` also needs to be present for this to work at all.

```
npm install --save connect
npm install --save seneca-web
npm install --save seneca-web-adapter-connect
```
## Quick Example

```
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
## More Examples

See [test/](test/) for usage examples.

## Motivation

Connect adapter for [seneca-web](https://github.com/senecajs/seneca-web). Maps HTTP routes to Seneca actions.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-web-adapter-connect/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

Please refer to the [seneca-web](https://github.com/senecajs/seneca-web) documentation on how to load routes.

## Contributing

The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

```
npm run test
```
## Background

Part of the [seneca-web](https://github.com/senecajs/seneca-web) adapter family.

[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
