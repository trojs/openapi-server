/* eslint-disable sonarjs/no-duplicate-string */
import test from 'node:test'
import assert from 'node:assert'
import { makeExpressCallback } from './express-callback.js'

const res = {
  values: {
    set: null,
    type: null,
    status: null,
    send: null,
    headers: {}
  },
  set (value) {
    this.values.set = value
  },
  type (value) {
    this.values.type = value
  },
  status (value) {
    this.values.status = value
    return {
      send: (value2) => {
        this.values.send = value2
      },
      json: (value2) => {
        this.values.send = value2
      },
      end: () => true
    }
  },
  json (value) {
    this.values.send = value
  },
  send (value) {
    this.values.send = value
  },
  end: () => true,
  setHeader (key, value) {
    this.values.headers[key] = value
  }
}

const specification = {
  info: {
    version: '1.2.3'
  }
}

const logger = {
  error: () => {},
  warn: () => {},
  debug: () => {}
}

const meta = {
  example: 'test'
}

const context = {
  operation: {
    parameters: []
  }
}
const req = {
  get: () => 'http://localhost:3000'
}

test('Test the express callback', async (t) => {
  await t.test('It should work', async () => {
    const currentRes = { ...res, values: { ...res.values } }

    const controller = () => ({
      test: 'ok'
    })

    const preFeedbackLog = []
    const postFeedbackLog = []
    const preFeedback = (args) => {
      preFeedbackLog.push(args)
    }
    const postFeedback = (args) => {
      postFeedbackLog.push(args)
    }

    const expressCallback = makeExpressCallback({
      controller,
      specification,
      logger,
      meta,
      preLog: preFeedback,
      postLog: postFeedback
    })

    const result = await expressCallback(context, req, currentRes)
    assert.deepEqual(result, {
      test: 'ok'
    })
    assert.deepEqual(preFeedbackLog[0].context, context)
    assert.deepEqual(postFeedbackLog[0].responseBody, {
      test: 'ok'
    })
  })

  await t.test('It should catch errors', async () => {
    const currentRes = { ...res, values: { ...res.values } }

    const controller = () => {
      throw new Error('test error')
    }

    const expressCallback = makeExpressCallback({
      controller,
      specification,
      logger,
      meta
    })

    const result = await expressCallback(context, req, currentRes)
    assert.deepEqual(result.message, 'test error')
    assert.deepEqual(result.status, 500)
    assert.deepEqual(result.errors, undefined)
  })

  await t.test('It should catch errors and return more details', async () => {
    const currentRes = { ...res, values: { ...res.values } }

    const controller = () => {
      throw new Error('test error')
    }
    const preFeedbackLog = []
    const postFeedbackLog = []
    const preFeedback = (args) => {
      preFeedbackLog.push(args)
    }
    const postFeedback = (args) => {
      postFeedbackLog.push(args)
    }

    const expressCallback = makeExpressCallback({
      controller,
      specification,
      logger,
      meta,
      errorDetails: true,
      preLog: preFeedback,
      postLog: postFeedback
    })

    const result = await expressCallback(context, req, currentRes)
    assert.deepEqual(result.message, 'test error')
    assert.deepEqual(result.status, 500)
    assert.deepEqual(result.errors[0].message, 'test error')
    assert.deepEqual(result.errors[0].type, 'Error')
    assert.deepEqual(preFeedbackLog[0].context, context)
    assert.deepEqual(postFeedbackLog, [])
  })
})
