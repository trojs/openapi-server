import test from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import { setupServer } from './server.js'

const envExample = {
  SECRET: 'test',
  PORT: 3000
}

const specFileLocation = './__fixtures__/spec.json'

const exampleResponse = {
  cursors: {
    first: 'http://localhost:3000/stock?page=0&size=10',
    last: 'http://localhost:3000/stock?page=4&size=10',
    next: 'http://localhost:3000/stock?page=3&size=10',
    prev: 'http://localhost:3000/stock?page=1&size=10',
    self: 'http://localhost:3000/stock?page=2&size=10'
  },
  items: [
    {
      id: 123
    }
  ],
  page: 0,
  pages: 0,
  size: 0,
  total: 0
}

const controllers = {
  getMessages: () => exampleResponse,
  getUsers: () => { throw new TypeError('test') }
}

const { app } = await setupServer({
  env: envExample,
  specFileLocation,
  controllers,
  origin: 'hckr.news'
})

const request = supertest(app)

test('Test the server', async (t) => {
  await t.test(
    'It should return status 200 for the specification (/api-docs)',
    async () => {
      const response = await request.get('/api-docs')

      assert.strictEqual(response.status, 200)
    }
  )

  await t.test(
    'It should return status 404 for a unknown page (/v1/xyz)',
    async () => {
      const response = await request.get('/v1/xyz')

      assert.strictEqual(response.status, 404)
      assert.deepEqual(
        {
          message: response.body.message,
          status: response.body.status
        },
        {
          message: 'Not found',
          status: 404
        }
      )
    }
  )

  await t.test(
    'It should response with a 401 message if you forgot the secret in the header',
    async () => {
      const response = await request.get('/v1/messages')

      assert.strictEqual(response.status, 401)
      assert.deepEqual(
        {
          message: response.body.message,
          status: response.body.status
        },
        {
          message: 'Unauthorized',
          status: 401
        }
      )
    }
  )

  await t.test(
    'It should response with a 400 message if the params are incorrect',
    async () => {
      const response = await request
        .get('/v1/messages?page=a')
        .set('x-api-key', envExample.SECRET)

      assert.strictEqual(response.status, 400)
      assert.deepEqual(
        {
          message: response.body.message,
          status: response.body.status,
          errors: response.body.errors
        },
        {
          message: 'Bad Request',
          status: 400,
          errors: [
            {
              instancePath: '/query/page',
              schemaPath:
                                '#/properties/query/properties/page/type',
              keyword: 'type',
              params: {
                type: 'integer'
              },
              message: 'must be integer'
            }
          ]
        }
      )
    }
  )

  await t.test('It should return items', async () => {
    const response = await request
      .get('/v1/messages?page=0&size=10')
      .set('x-api-key', envExample.SECRET)

    assert.strictEqual(response.status, 200)
    assert.deepEqual(response.body, exampleResponse)
  })

  await t.test('It should catch error\'s', async () => {
    const response = await request
      .get('/v1/users')
      .set('x-api-key', envExample.SECRET)

    assert.strictEqual(response.status, 422)
    assert.deepEqual(response.body.status, 422)
    assert.deepEqual(response.body.message, 'test')
  })
})
