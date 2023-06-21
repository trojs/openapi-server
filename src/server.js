import express from 'express'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import { openAPI } from './openapi.js'
import { setupRouter } from './router.js'

/**
 * @typedef {import('express').Express} Express
 */

/**
 * Setup the server
 * @async
 * @param {object} params
 * @param {object} params.env
 * @param {string} params.specFileLocation
 * @param {object=} params.specFileBase
 * @param {object} params.controllers
 * @param {string=} params.origin
 * @returns {Promise<{ app: Express; }>}
 */
const setupServer = async ({ env, specFileLocation, specFileBase, controllers, origin = '*' }) => {
  const { openAPISpecification } = await openAPI({ file: specFileLocation, base: specFileBase })
  const { api } = setupRouter({
    env,
    openAPISpecification,
    controllers
  })
  const corsOptions = {
    origin
  }
  api.init()
  const app = express()
  app.use(cors(corsOptions))
  app.use(compression())
  app.use(helmet(getOriginResourcePolicy(origin)))
  app.use(express.json())
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openAPISpecification))
  app.get('/api-docs', (_request, response) =>
    response.json(openAPISpecification)
  )
  app.use((request, response) =>
    api.handleRequest(request, request, response)
  )

  return { app }
}

/**
 * Get the origin resource policy
 * @param {string} origin
 * @returns {{ crossOriginResourcePolicy: { policy: string } }}
 */
const getOriginResourcePolicy = (origin) => ({
  crossOriginResourcePolicy: {
    policy: origin === '*' ? 'cross-origin' : 'same-origin'
  }
})

export { setupServer }
