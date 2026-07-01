import test from 'node:test'
import assert from 'node:assert'
import { parseParams } from './params.js'

const AMSTERDAM = 'Amsterdam'
const POST_EMAIL = 'post@example.com'
const TEST_EMAIL = 'test@example.com'
const EVENT_DATE = new Date('2026-01-15T10:00:00.000Z')

const TestCases = [
  {
    description: 'Parse params to the types defined in the spec',
    query: { page: '0', size: '10' },
    spec: [
      {
        name: 'size',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 10000,
          example: 10,
          default: 42
        }
      },
      {
        name: 'page',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 0,
          example: 0,
          default: 1
        }
      }
    ],
    expectedResult: {
      page: 0,
      size: 10
    }
  },
  {
    description:
            'Get the default values from the schema if no query params are given',
    query: {},
    spec: [
      {
        name: 'max',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 10000,
          example: 10,
          default: 42
        }
      },
      {
        name: 'index',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 0,
          example: 0,
          default: 1
        }
      }
    ],
    expectedResult: {
      index: 1,
      max: 42
    }
  },
  {
    description:
            'Dont get the example values from the schema if no query params are given and mock is not enabled',
    query: {},
    spec: [
      {
        name: 'page',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 0,
          example: 0
        }
      }
    ],
    expectedResult: {}
  },
  {
    description:
            'Get the example values from the schema if no query params are given and mock is enabled',
    query: {},
    spec: [
      {
        name: 'page',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 0,
          example: 0
        }
      }
    ],
    mock: true,
    expectedResult: {
      page: 0
    }
  },
  {
    description:
            'It should not throw if no query params are given and mock is not enabled',
    query: undefined,
    spec: [
      {
        name: 'size',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 10000,
          example: 10
        }
      }
    ],
    expectedResult: {}
  },
  {
    description:
            'It should not throw if no query params are given and mock is enabled',
    query: undefined,
    spec: [
      {
        name: 'size',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 10000,
          example: 10
        }
      }
    ],
    mock: true,
    expectedResult: {
      size: 10
    }
  },
  {
    description: 'Parse mixed params to the types defined in the spec',
    query: { name: 'Pieter', ok: 'true' },
    spec: [
      {
        name: 'name',
        required: false,
        in: 'query',
        schema: {
          type: 'string',
          example: 10
        }
      },
      {
        name: 'ok',
        required: false,
        in: 'query',
        schema: {
          type: 'boolean',
          example: 0
        }
      }
    ],
    expectedResult: {
      name: 'Pieter',
      ok: true
    }
  },
  {
    description:
            'It should set the boolean value to false on a string with the value false',
    query: { ok: 'false' },
    spec: [
      {
        name: 'ok',
        required: false,
        in: 'query',
        schema: {
          type: 'boolean',
          example: 0
        }
      }
    ],
    expectedResult: {
      ok: false
    }
  },
  {
    description: 'Parse params from POST body',
    post: { username: 'john', count: '5' },
    spec: [
      {
        name: 'username',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: 'user'
        }
      },
      {
        name: 'count',
        required: false,
        in: 'body',
        schema: {
          type: 'integer',
          example: 0
        }
      }
    ],
    expectedResult: {
      username: 'john',
      count: 5
    }
  },
  {
    description: 'POST params take precedence over query params',
    query: { email: 'query@example.com' },
    post: { email: POST_EMAIL },
    spec: [
      {
        name: 'email',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: TEST_EMAIL
        }
      }
    ],
    expectedResult: {
      email: POST_EMAIL
    }
  },
  {
    description: 'Parse nested params from POST body using dot notation',
    post: { user: { name: 'John', age: '30' } },
    spec: [
      {
        name: 'user.name',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: 'Jane'
        }
      },
      {
        name: 'user.age',
        required: false,
        in: 'body',
        schema: {
          type: 'integer',
          example: 25
        }
      }
    ],
    expectedResult: {
      'user.name': 'John',
      'user.age': 30
    }
  },
  {
    description: 'Parse deeply nested params from POST body',
    post: { user: { address: { city: AMSTERDAM, zip: '1012' } } },
    spec: [
      {
        name: 'user.address.city',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: AMSTERDAM
        }
      },
      {
        name: 'user.address.zip',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: '1000'
        }
      }
    ],
    expectedResult: {
      'user.address.city': AMSTERDAM,
      'user.address.zip': '1012'
    }
  },
  {
    description: 'Parse date object from nested POST body',
    post: { event: { startsAt: EVENT_DATE } },
    spec: [
      {
        name: 'event.startsAt',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          format: 'date-time',
          example: EVENT_DATE.toISOString()
        }
      }
    ],
    expectedResult: {
      'event.startsAt': EVENT_DATE
    }
  },
  {
    description: 'Parse nested params from query using dot notation',
    query: { 'user.name': 'Alice', 'user.age': '28' },
    spec: [
      {
        name: 'user.name',
        required: false,
        in: 'query',
        schema: {
          type: 'string',
          example: 'Bob'
        }
      },
      {
        name: 'user.age',
        required: false,
        in: 'query',
        schema: {
          type: 'integer',
          example: 25
        }
      }
    ],
    expectedResult: {
      'user.name': 'Alice',
      'user.age': 28
    }
  },
  {
    description: 'Mix nested POST and flat query params',
    query: { token: 'abc123' },
    post: { user: { email: TEST_EMAIL } },
    spec: [
      {
        name: 'token',
        required: false,
        in: 'query',
        schema: {
          type: 'string',
          example: 'xyz'
        }
      },
      {
        name: 'user.email',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: TEST_EMAIL
        }
      }
    ],
    expectedResult: {
      token: 'abc123',
      'user.email': TEST_EMAIL
    }
  },
  {
    description: 'Handle missing nested path gracefully',
    post: { user: { name: 'John' } },
    spec: [
      {
        name: 'user.address.city',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: AMSTERDAM,
          default: 'Unknown'
        }
      }
    ],
    expectedResult: {
      'user.address.city': 'Unknown'
    }
  },
  {
    description: 'Use default value when nested param not found in POST or query',
    post: { user: { name: 'John' } },
    spec: [
      {
        name: 'user.status',
        required: false,
        in: 'body',
        schema: {
          type: 'string',
          example: 'active',
          default: 'inactive'
        }
      }
    ],
    expectedResult: {
      'user.status': 'inactive'
    }
  }
]

test('Parse params', async (t) => {
  await Promise.all(
    TestCases.map(
      async ({ description, query, post, spec, mock, expectedResult }) => {
        await t.test(description, () => {
          assert.deepEqual(
            parseParams({ query, post, spec, mock }),
            expectedResult
          )
        })
      }
    )
  )
})
