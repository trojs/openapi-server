import globals from 'globals'
import pluginJs from '@eslint/js'
import { plugins, rules } from '@trojs/lint'

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    settings: {
      jsdoc: {
        mode: 'typescript'
      },
      react: {
        version: '18.3.1'
      }
    },
    plugins: {
      ...plugins
    },
    rules: {
      ...rules.all
    },
    files: ['**/*.js']
  }
]
