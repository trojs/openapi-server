import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
import bodyParser from 'body-parser'
import { hostname } from 'node:os'
import { openAPI } from './openapi.js'
import { Api } from './api.js'

/* eslint-disable sonarjs/cors */

/**
 * Get the origin resource policy
 * @param {string} origin
 * @returns {{ crossOriginResourcePolicy: { policy: string, directives: object } }}
 */
const getOriginResourcePolicy = (origin) => ({
  crossOriginResourcePolicy: {
    policy: origin === '*' ? 'cross-origin' : 'same-origin',
    directives: {
      // ...
      'require-trusted-types-for': ['\'script\'']
    }
  }
})

/**
 * @typedef {import('express-serve-static-core').Request} Request
 * @typedef {import('express-serve-static-core').Response} Response
 * @typedef {import('openapi-backend').Context} Context
 * @typedef {import('./api.js').ApiSchema} ApiSchema
 * @typedef {import('./api.js').Logger} Logger
 * @typedef {import('express').Express} Express
 * @typedef {import('@sentry/types').Integration} Integration
 */

/**
 * @template [T=unknown]
 * @typedef {object} Controller
 * @property {Context=} context
 * @property {Request=} request
 * @property {Response=} response
 * @property {object=} parameters
 * @property {object=} specification
 * @property {T=} post
 * @property {string=} url
 * @property {Logger=} logger
 * @property {object=} meta
 */

/**
 * @typedef {object} SentryConfig
 * @property {string=} dsn
 * @property {number=} tracesSampleRate
 * @property {number=} profilesSampleRate
 * @property {string=} release
 * @property {string=} environment
 * @property {string=} serverName
 */

/**
 * Setup the server
 * @async
 * @param {object} params
 * @param {ApiSchema[]} params.apis
 * @param {string=} params.origin
 * @param {string=} params.staticFolder
 * @param {SentryConfig=} params.sentry
 * @param {string=} params.poweredBy
 * @param {string=} params.version
 * @param {any[]=} params.middleware
 * @param {string|number=} params.maximumBodySize
 * @returns {Promise<{ app: Express }>}
 */
export const setupServer = async ({
  apis,
  origin = '*',
  staticFolder,
  sentry,
  poweredBy = 'TroJS',
  version = '1.0.0',
  middleware = [],
  maximumBodySize = undefined
}) => {
  const corsOptions = {
    origin
  }

  const app = express()

  if (sentry) {
    Sentry.init({
      dsn: sentry.dsn,
      environment: sentry.environment || process.env.NODE_ENV || 'production',
      tracesSampleRate: sentry.tracesSampleRate || 1.0,
      profilesSampleRate: sentry.profilesSampleRate || 1.0,
      release: sentry.release || process.env.SOURCE_VERSION,
      serverName: sentry.serverName || process.env.SERVER_NAME || hostname()
    })
  }

  app.use(cors(corsOptions))
  app.use(compression())
  app.use(helmet(getOriginResourcePolicy(origin)))
  app.use(express.json({ limit: maximumBodySize }))
  middleware.forEach((fn) => app.use(fn))
  app.use(bodyParser.urlencoded({ extended: false, limit: maximumBodySize }))
  app.use((_request, response, next) => {
    response.setHeader('X-Powered-By', poweredBy)
    response.setHeader('X-Version', version)
    next()
  })

  if (staticFolder) {
    app.use(express.static(staticFolder))
  }

  apis.forEach((api) => {
    const apiRoutes = new Api(api)
    const routes = apiRoutes.setup()
    app.use(`/${api.version}`, routes)
  })

  if (sentry) {
    Sentry.setupExpressErrorHandler(app)
  }

  return { app }
}

export { openAPI, Api }
