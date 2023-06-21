import test from 'node:test'
import assert from 'node:assert'
import { setupRouter } from './router.js'

const envExample = {
  SECRET: 'test',
  PORT: 3000
}

const controllers = {
  getMessages: () => ({
    test: 'ok'
  })
}
const specFileLocation = './__fixtures__/spec.json'

const { api } = setupRouter({ env: envExample, specFileLocation, controllers })
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
})
