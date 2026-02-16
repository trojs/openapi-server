import test from 'node:test'
import assert from 'node:assert'
import { setupRouter } from './router.js'
import openAPISpecification from './__fixtures__/spec.js'

const envExample = {
  SECRET: 'test',
  PORT: 3000
}

const logger = {
  debug: (data) => { },
  error: (data) => { },
  info: (data) => { }
}

const resMock = {
  newStatus: null,
  response: null,
  type: () => true,
  status: (newStatus) => ({
    json: (data) => {
      resMock.newStatus = newStatus
      resMock.response = data
    },
    send: (data) => {
      resMock.newStatus = newStatus
      resMock.response = data
    }
  }),
  json: (data) => {
    resMock.response = data
  }
}

test('Test the router', async (t) => {
  await t.test(
    'It should response with a nice message if the response is invalid',
    async () => {
      const controllers = {
        getMessages: () => ({
          test: 'ok'
        })
      }

      const { api } = setupRouter({
        secret: envExample.SECRET,
        openAPISpecification,
        controllers,
        validateResponse: true,
        customizeAjv: (originalAjv) => {
          originalAjv.addKeyword('example', {
            validate: (schema, data) => data === 'example',
            errors: false
          })
          return originalAjv
        },
        logger
      })
      const context = {
        response: {
          status: 200,
          timestamp: new Date(),
          message: 'OK'
        },
        operation: 'get',
        api: {
          validateResponse: () => ({ errors: 'test' }),
          validateResponseHeaders: () => undefined
        }
      }
      const request = {}
      const response = resMock

      api.handlers.postResponseHandler(context, request, response)

      assert.strictEqual(resMock.newStatus, 502)

      const responseBody = resMock.response
      assert.deepEqual(
        {
          message: responseBody.message,
          status: responseBody.status,
          errors: responseBody.errors
        },
        {
          message: 'Bad response',
          status: 502,
          errors: 'test'
        }
      )
    }
  )

  await t.test(
    'It should not validate response when validateResponse is false',
    async () => {
      const controllers = {
        getMessages: () => ({
          test: 'ok'
        })
      }

      const { api } = setupRouter({
        secret: envExample.SECRET,
        openAPISpecification,
        controllers,
        validateResponse: false,
        logger
      })

      // Handler should exist but not perform validation
      assert.notStrictEqual(api.handlers.postResponseHandler, undefined)
      assert.strictEqual(typeof api.handlers.postResponseHandler, 'function')

      // Test that validation is not performed (no 502 error even with invalid response)
      const context = {
        response: {
          status: 200,
          timestamp: new Date(),
          message: 'OK'
        },
        operation: 'get',
        api: {
          validateResponse: () => ({ errors: 'test' }),
          validateResponseHeaders: () => undefined
        }
      }
      const request = {}
      const response = { ...resMock, values: { ...resMock.values } }

      api.handlers.postResponseHandler(context, request, response)

      // Should not return 502 because validation is disabled
      assert.strictEqual(resMock.response.status, 200)
      assert.strictEqual(resMock.response.message, 'OK')
    }
  )

  await t.test(
    'It should register postResponseHandler when validateResponse is true',
    async () => {
      const controllers = {
        getMessages: () => ({
          test: 'ok'
        })
      }

      const { api } = setupRouter({
        secret: envExample.SECRET,
        openAPISpecification,
        controllers,
        validateResponse: true,
        logger
      })

      assert.notStrictEqual(api.handlers.postResponseHandler, undefined)
      assert.strictEqual(typeof api.handlers.postResponseHandler, 'function')
    }
  )

  await t.test(
    'It should register postResponseHandler by default (when validateResponse is not specified)',
    async () => {
      const controllers = {
        getMessages: () => ({
          test: 'ok'
        })
      }

      const { api } = setupRouter({
        secret: envExample.SECRET,
        openAPISpecification,
        controllers,
        logger
      })

      assert.notStrictEqual(api.handlers.postResponseHandler, undefined)
      assert.strictEqual(typeof api.handlers.postResponseHandler, 'function')
    }
  )
})
