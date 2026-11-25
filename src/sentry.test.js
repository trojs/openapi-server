import test from 'node:test'
import assert from 'node:assert'
import http from 'node:http'
import supertest from 'supertest'
import * as Sentry from '@sentry/node'
import { setupServer } from './server.js'

const startSink = async () => {
  const envelopes = []
  const server = http.createServer((request, response) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      envelopes.push(Buffer.concat(chunks).toString())
      response.end('{}')
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  return { envelopes, server, port: server.address().port }
}

const getErrorEvent = (envelopes) => {
  const line = envelopes
    .flatMap((envelope) => envelope.split('\n'))
    .find((item) => item.includes('sentry-test-error') && item.startsWith('{"exception'))

  return line ? JSON.parse(line) : undefined
}

test('It should capture errors and not collect extra data by default', async () => {
  const { envelopes, server, port } = await startSink()
  const { app } = await setupServer({
    apis: [],
    sentry: { dsn: `http://key@127.0.0.1:${port}/1` },
    middleware: [
      (request, _response, next) => {
        if (request.path === '/error') {
          throw new Error('sentry-test-error')
        }
        next()
      }
    ]
  })

  const response = await supertest(app)
    .get('/error')
    .set('Cookie', 'session=secret-value')

  await Sentry.flush(5000)
  await Sentry.close(2000)
  server.close()

  assert.strictEqual(response.status, 500)

  const event = getErrorEvent(envelopes)
  assert.ok(event, 'the error should be sent to Sentry')
  assert.strictEqual(event.user, undefined)
  assert.strictEqual(event.request.cookies, undefined)
  assert.ok(!JSON.stringify(event.request).includes('secret-value'))
})
