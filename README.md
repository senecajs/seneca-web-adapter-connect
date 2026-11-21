![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/web-adapter-connect

[![npm version](https://img.shields.io/npm/v/@seneca/web-adapter-connect.svg)](https://npmjs.com/package/@seneca/web-adapter-connect)
[![build](https://github.com/senecajs/seneca-web-adapter-connect/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-web-adapter-connect/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-web-adapter-connect/badge.svg)](https://snyk.io/test/github/senecajs/seneca-web-adapter-connect)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

The [Connect](https://github.com/senchalabs/connect) adapter for
[@seneca/web](https://github.com/senecajs/seneca-web). Version 2 works
with Seneca 4 and `@seneca/web` 3, on Node.js 24 and later. Seneca 3
users stay on `seneca-web-adapter-connect@1`.

## Install

`seneca` and `@seneca/web` are peer dependencies. `connect` also needs
to be present for this to work at all.

```
npm install seneca@^4 @seneca/web @seneca/web-adapter-connect connect
```

Versions up to 1.1.0 were published as `seneca-web-adapter-connect`;
from 2.0.0 the package is `@seneca/web-adapter-connect`. `@seneca/web`
was published as `seneca-web` up to 2.2.2. Name the Seneca version:
until Seneca 4 is the default on npm, a bare `npm install seneca`
installs Seneca 3, which this version does not support.

## Quick Example

```
const Seneca = require('seneca')
const SenecaWeb = require('@seneca/web')
const Connect = require('connect')
const seneca = Seneca()
seneca.use(SenecaWeb, {
  context: Connect(),
  adapter: require('@seneca/web-adapter-connect')
})
seneca.ready(() => {
  const app = seneca.export('web/context')()
  app.listen(3000)
})
```
## More Examples

See [test/](test/) for usage examples.

## Motivation

Connect adapter for [@seneca/web](https://github.com/senecajs/seneca-web). Maps HTTP routes to Seneca actions.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-web-adapter-connect/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

Please refer to the [@seneca/web](https://github.com/senecajs/seneca-web) documentation on how to load routes.

Action errors reach Connect's error middleware through `next(err)`. On
Seneca 4 the error is the one the action replied with or threw, so read
`err.message` and `err.code`; Seneca 3 wrapped it and kept the original
in `err.orig`.

## Contributing

The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

Node.js 24 or later:

```
npm install
npm test
```

`npm test` runs ESLint, then the tests with `node:test` and a line
coverage threshold of 80%.
## Background

Part of the [seneca-web](https://github.com/senecajs/seneca-web) adapter family.

[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
