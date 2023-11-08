import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import { openAPI } from './openapi.js'
import { Api } from './api.js'

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
      'require-trusted-types-for': ["'script'"]
    }
  }
})

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('openapi-backend').Context} Context
 * @typedef {import('./api.js').ApiSchema} ApiSchema
 * @typedef {import('./api.js').Logger} Logger
 * @typedef {import('express').Express} Express
 * @typedef {object} Controller
 * @property {Context=} context
 * @property {Request=} request
 * @property {Response=} response
 * @property {object=} parameters
 * @property {object=} specification
 * @property {object=} post
 * @property {string=} url
 * @property {Logger=} logger
 */

/**
 * Setup the server
 * @async
 * @param {object} params
 * @param {ApiSchema[]} params.apis
 * @param {string=} params.origin
 * @param {string=} params.staticFolder
 * @returns {Promise<{ app: Express }>}
 */
export const setupServer = async ({ apis, origin = '*', staticFolder }) => {
  const corsOptions = {
    origin
  }
  const app = express()
  app.use(cors(corsOptions))
  app.use(compression())
  app.use(helmet(getOriginResourcePolicy(origin)))
  app.use(express.json())

  if (staticFolder) {
    app.use(express.static(staticFolder))
  }

  apis.forEach((api) => {
    const apiRoutes = new Api(api)
    const routes = apiRoutes.setup()
    app.use(`/${api.version}`, routes)
  })

  return { app }
}

export { openAPI, Api }
