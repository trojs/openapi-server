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
 * @typedef {import('./api.js').ApiSchema} ApiSchema
 * @typedef {import('express').Express} Express
 * @typedef {object} Controller
 * @property {object=} context
 * @property {object=} request
 * @property {object=} response
 * @property {object=} parameters
 * @property {object=} specification
 * @property {string=} url
 */

/**
 * Setup the server
 * @async
 * @param {object} params
 * @param {object} params.env
 * @param {ApiSchema[]} params.apis
 * @param {string=} params.origin
 * @param {string=} params.staticFolder
 * @param {string=} params.apiRoot
 * @param {boolean=} params.strictSpecification
 * @returns {Promise<{ app: Express }>}
 */
export const setupServer = async ({ env, apis, origin = '*', staticFolder, apiRoot = '/', strictSpecification = true }) => {
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
