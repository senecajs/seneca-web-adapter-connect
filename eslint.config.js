'use strict'

const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    // .github/scripts holds the release tooling, a copy of the template in
    // senecajs/admin, where it is tested
    ignores: ['node_modules/**', 'coverage/**', 'docs/annotated/**', '.github/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
]
