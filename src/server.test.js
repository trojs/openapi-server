/* eslint-disable prefer-destructuring */
import test from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import { Api, openAPI, setupServer } from './server.js'

/**
 * @typedef {import('openapi-backend').Handler} Handler
 */

const envExample = {
  SECRET: 'test',
  PORT: 3000
}

const STARTS_AT = '2026-01-15T10:00:00.000Z'

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

// Temporal is available in Node 26 and later
const { Temporal } = globalThis
const DateType = Temporal ? Temporal.Instant : Date
const iso = (value) => (Temporal ? value?.toString() : value?.toISOString())
const parsedDate = (value) => (Temporal ? Temporal.Instant.from(value).toString() : value)
const dateClass = Temporal ? 'PlainDate' : 'Date'
const dateTimeClass = Temporal ? 'Instant' : 'Date'

const controllers = {
  getMessages: () => exampleResponse,
  getUsers: () => {
    throw new TypeError('test')
  },
  getUserSecure: ({ context }) => context.security.customSecurityHandler,
  createEvent: ({ parameters, post }) => ({
    parameterKeys: Object.keys(parameters),
    isDate: parameters['event.startsAt'] instanceof DateType,
    startsAtIso: iso(parameters['event.startsAt']),
    postIsDate: post?.event?.startsAt instanceof DateType,
    postStartsAtIso: iso(post?.event?.startsAt),
    postTitle: post?.event?.title
  }),
  createAppointment: ({ post }) => ({
    // Dates are returned as date objects, not as strings
    date: post.date,
    startsAt: post.startsAt,
    kinds: {
      date: post.date.constructor.name,
      startsAt: post.startsAt.constructor.name,
      reminder: post.reminders[0].date.constructor.name
    }
  })
}

const { openAPISpecification } = await openAPI({ file: specFileLocation })

/**
 * @type {Handler}
 */
function customHandler (context) {
  const authHeader = context.request.headers.authorization
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }
  const token = authHeader.replace('Bearer ', '')

  if (token === 'secret') {
    return 42
  }

  return false
}

const securityHandlers = [
  {
    name: 'apiKey',
    handler: (context) =>
      context.request.headers['x-api-key'] === envExample.SECRET
  },
  {
    name: 'customSecurityHandler',
    handler: customHandler
  }
]
const api = new Api({
  version: 'v1',
  specification: openAPISpecification,
  controllers,
  secret: envExample.SECRET,
  securityHandlers,
  ajvOptions: { allErrors: true }
})
const { app } = await setupServer({
  env: envExample,
  apis: [api],
  origin: 'tro.js',
  staticFolder: './__fixtures__/'
})

const request = supertest(app)

test('Test the server', async (t) => {
  await t.test(
    'It should return Cache-Control and ETag headers for /v1/api-docs and support 304',
    async () => {
      // First request to get headers
      const firstResponse = await request.get('/v1/api-docs')
      assert.strictEqual(firstResponse.status, 200)
      assert.ok(firstResponse.headers['cache-control'])
      assert.ok(firstResponse.headers['etag'])

      // Second request with If-None-Match header
      const etag = firstResponse.headers['etag']
      const secondResponse = await request
        .get('/v1/api-docs')
        .set('If-None-Match', etag)

      assert.strictEqual(secondResponse.status, 304)
      assert.strictEqual(secondResponse.text, '')
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
        .get('/v1/messages?page=a&size=b')
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
              instancePath: '/query/size',
              keyword: 'type',
              message: 'must be integer',
              params: {
                type: 'integer'
              },
              schemaPath:
                                '#/properties/query/properties/size/type'
            },
            {
              instancePath: '/query/page',
              keyword: 'type',
              message: 'must be integer',
              params: {
                type: 'integer'
              },
              schemaPath:
                                '#/properties/query/properties/page/type'
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

  await t.test(
    'It should return the mocked user, because we don\'t have a controller yet',
    async () => {
      const response = await request
        .get('/v1/user')
        .set('x-api-key', envExample.SECRET)

      assert.strictEqual(response.status, 200)
      assert.deepEqual(response.body, {
        name: 'Pieter'
      })
    }
  )

  await t.test('It should catch error\'s', async () => {
    const response = await request
      .get('/v1/users')
      .set('x-api-key', envExample.SECRET)

    assert.strictEqual(response.status, 422)
    assert.deepEqual(response.body.status, 422)
    assert.deepEqual(response.body.message, 'test')
  })

  await t.test(
    'It should return 200 with the right secret for the custom security handler',
    async () => {
      const response = await request
        .get('/v1/user-secure')
        .set('authorization', 'secret')

      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.body, 42)
    }
  )

  await t.test(
    'It should return 401 with the wrong secret for the custom security handler',
    async () => {
      const response = await request
        .get('/v1/user-secure')
        .set('authorization', 'not-the-secret')

      assert.strictEqual(response.status, 401)
    }
  )

  await t.test(
    'It should parse nested POST date payload into Date for controller parameters',
    async () => {
      const startsAt = STARTS_AT
      const expectedStartsAt = parsedDate(startsAt)
      const response = await request
        .post('/v1/events')
        .set('x-api-key', envExample.SECRET)
        .send({
          event: {
            startsAt,
            title: 'Integration test event'
          }
        })

      assert.strictEqual(response.status, 200)
      assert.deepEqual(response.body, {
        parameterKeys: ['event.startsAt'],
        isDate: true,
        startsAtIso: expectedStartsAt,
        postIsDate: true,
        postStartsAtIso: expectedStartsAt,
        postTitle: 'Integration test event'
      })
    }
  )

  await t.test(
    'It should parse dates in the request body and accept dates in the response',
    async () => {
      const response = await request
        .post('/v1/appointments')
        .set('x-api-key', envExample.SECRET)
        .send({
          date: '2026-01-15',
          startsAt: STARTS_AT,
          reminders: [{ date: '2026-01-14' }]
        })

      assert.strictEqual(response.status, 200)
      assert.deepEqual(response.body, {
        date: '2026-01-15',
        startsAt: parsedDate(STARTS_AT),
        kinds: {
          date: dateClass,
          startsAt: dateTimeClass,
          reminder: dateClass
        }
      })
    }
  )
})
