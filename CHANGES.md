# Changes

## 2.0.0 2026-11-21

First release under the name `@seneca/web-adapter-connect`. Versions up
to 1.1.0 were published as `seneca-web-adapter-connect`.

* Seneca 4: the peer dependency is `seneca` `^4.0.0`. Seneca 3 users
  stay on `seneca-web-adapter-connect@1`.
* Renamed from `seneca-web-adapter-connect` to
  `@seneca/web-adapter-connect`.
* The peer dependency on the plugin is `@seneca/web` `^3.0.0`, the new
  name of `seneca-web` (it replaces `seneca-web` `^1.0.0 || ^2.0.0`).
* Node.js 24 or later (`engines.node` `>=24`).
* Action errors reach Connect's error middleware unchanged: Seneca 4
  does not wrap them, so error middleware reads `err.message`, not
  `err.orig.message` (B12).
* The query string is read from the request target directly instead
  of with the deprecated `url.parse`, which printed a deprecation
  warning on Node.js 24 and later. `args.query` is unchanged, also for
  targets such as `//?a=1` that the WHATWG `URL` parser rejects.
* Removed the unused `eraro` dependency; `lodash` `^4.17.21`.
* Tests: `node:test` and `node:assert` with `fetch`, replacing lab 13,
  code and request; servers on an ephemeral port; every Seneca instance
  closed; new tests for the query string, a request target that is not
  a valid URL path, a missing context and middleware errors. ESLint 10 with a flat `eslint.config.js` runs
  before the tests. Tested with Seneca 4.0.0 and `@seneca/web` 3.0.0
  on Node.js 26.
* Removed Travis CI and the coveralls and docco scripts, and the unused
  `cookie-parser`, `passport`, `passport-local` and
  `eslint-config-seneca` development dependencies.
* `package.json`: `repository.url` in the `git+https` form,
  `publishConfig.access` `public`, `CHANGES.md` in `files`;
  `package-lock.json` is no longer committed.

## 1.1.0 2017-12-03

* Adds support for middleware (#9)

## 1.0.3 2016-10-02

* Allow host application to handle errors (#2)
* Update peerDependency to work with seneca-web@2.x (thanks @gknedo)

## 1.0.0 2016-09-27

* Created module, copied from `seneca-web`
