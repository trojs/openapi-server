import test from 'node:test'
import assert from 'node:assert'
import {
  getRequestBodySchema,
  isDateLike,
  parseDate,
  parseSchemaDates,
  serializeDates
} from './dates.js'

const DATE = '2026-01-15'
const DATE_TIME = '2026-01-15T10:00:00Z'
const DATE_TIME_MS = '2026-01-15T10:00:00.000Z'
const REMINDER_DATE = '2026-01-14'

const fakeTemporalType = (name) =>
  class {
    static from (value) {
      return Object.assign(new this(), { value })
    }

    get [Symbol.toStringTag] () {
      return `Temporal.${name}`
    }

    toString () {
      return this.value
    }
  }

const withTemporal = (callback) => {
  const original = globalThis.Temporal
  globalThis.Temporal = {
    PlainDate: fakeTemporalType('PlainDate'),
    Instant: fakeTemporalType('Instant')
  }
  try {
    return callback(globalThis.Temporal)
  } finally {
    if (original === undefined) {
      delete globalThis.Temporal
    } else {
      globalThis.Temporal = original
    }
  }
}

const withoutTemporal = (callback) => {
  const original = globalThis.Temporal
  delete globalThis.Temporal
  try {
    return callback()
  } finally {
    if (original !== undefined) {
      globalThis.Temporal = original
    }
  }
}

test('parseDate', async (t) => {
  await t.test('It should use Date when Temporal is not available', () => {
    withoutTemporal(() => {
      assert.deepEqual(
        parseDate({ value: DATE, format: 'date' }),
        new Date(DATE)
      )
      assert.deepEqual(
        parseDate({ value: DATE_TIME }),
        new Date(DATE_TIME)
      )
    })
  })

  await t.test('It should use Temporal.PlainDate for a date', () => {
    withTemporal(({ PlainDate }) => {
      const result = parseDate({ value: DATE, format: 'date' })
      assert.ok(result instanceof PlainDate)
      assert.strictEqual(result.toString(), DATE)
    })
  })

  await t.test('It should use Temporal.Instant for a date-time', () => {
    withTemporal(({ Instant }) => {
      const result = parseDate({
        value: DATE_TIME,
        format: 'date-time'
      })
      assert.ok(result instanceof Instant)
    })
  })

  await t.test('It should keep values that are already a date', () => {
    withTemporal(({ PlainDate }) => {
      const date = new Date()
      const plainDate = PlainDate.from(DATE)
      assert.strictEqual(parseDate({ value: date }), date)
      assert.strictEqual(parseDate({ value: plainDate }), plainDate)
    })
  })
})

test('parseSchemaDates', async (t) => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      date: { type: 'string', format: 'date' },
      startsAt: { type: 'string', format: 'date-time' },
      reminders: {
        type: 'array',
        items: {
          type: 'object',
          properties: { date: { type: 'string', format: 'date' } }
        }
      },
      dates: {
        type: 'object',
        additionalProperties: { type: 'string', format: 'date' }
      },
      merged: {
        allOf: [
          { type: 'object', properties: { endsAt: { type: 'string', format: 'date-time' } } }
        ]
      }
    }
  }
  const body = {
    title: DATE,
    date: DATE,
    startsAt: DATE_TIME,
    reminders: [{ date: REMINDER_DATE }],
    dates: { holiday: '2026-12-25' },
    merged: { endsAt: '2026-01-15T11:00:00Z' },
    unknown: DATE
  }

  await t.test('It should parse all date fields with Temporal', () => {
    withTemporal(({ PlainDate, Instant }) => {
      const result = parseSchemaDates({ value: body, schema })

      assert.strictEqual(result.title, DATE)
      assert.strictEqual(result.unknown, DATE)
      assert.ok(result.date instanceof PlainDate)
      assert.ok(result.startsAt instanceof Instant)
      assert.ok(result.reminders[0].date instanceof PlainDate)
      assert.ok(result.dates.holiday instanceof PlainDate)
      assert.ok(result.merged.endsAt instanceof Instant)
    })
  })

  await t.test('It should parse all date fields with Date', () => {
    withoutTemporal(() => {
      const result = parseSchemaDates({ value: body, schema })

      assert.deepEqual(result.date, new Date(DATE))
      assert.deepEqual(result.startsAt, new Date(DATE_TIME))
      assert.deepEqual(result.reminders[0].date, new Date(REMINDER_DATE))
    })
  })

  await t.test('It should not mutate the original value', () => {
    withoutTemporal(() => {
      parseSchemaDates({ value: body, schema })
      assert.strictEqual(body.date, DATE)
      assert.strictEqual(body.reminders[0].date, REMINDER_DATE)
    })
  })

  await t.test('It should return the value without a schema', () => {
    assert.strictEqual(parseSchemaDates({ value: body }), body)
  })
})

test('serializeDates', async (t) => {
  await t.test('It should convert Date and Temporal objects to strings', () => {
    withTemporal(({ PlainDate }) => {
      assert.deepEqual(
        serializeDates({
          date: PlainDate.from(DATE),
          startsAt: new Date(DATE_TIME_MS),
          list: [PlainDate.from('2026-01-16')],
          count: 1
        }),
        {
          date: DATE,
          startsAt: DATE_TIME_MS,
          list: ['2026-01-16'],
          count: 1
        }
      )
    })
  })

  await t.test('It should keep other values', () => {
    assert.strictEqual(serializeDates('text'), 'text')
    assert.strictEqual(serializeDates(undefined), undefined)
  })
})

test('isDateLike', () => {
  assert.strictEqual(isDateLike(new Date()), true)
  assert.strictEqual(isDateLike(DATE), false)
  assert.strictEqual(isDateLike(null), false)
})

test('getRequestBodySchema', async (t) => {
  const schema = { type: 'object' }

  await t.test('It should find the JSON schema', () => {
    assert.strictEqual(
      getRequestBodySchema({
        requestBody: { content: { 'application/json': { schema } } }
      }),
      schema
    )
  })

  await t.test('It should return undefined without a JSON request body', () => {
    assert.strictEqual(getRequestBodySchema({}), undefined)
    assert.strictEqual(
      getRequestBodySchema({
        requestBody: { content: { 'text/plain': { schema } } }
      }),
      undefined
    )
  })
})
