import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { setupRouter } from './router.js'

/**
 * @typedef {object} Logger
 * @property {Function} error
 * @property {Function} warn
 * @property {Function} info
 * @property {Function} debug
 * @typedef {object} ApiSchema
 * @property {string} version
 * @property {object} specification
 * @property {object} controllers
 * @property {string=} secret
 * @property {string=} apiRoot
 * @property {boolean=} strictSpecification
 * @property {boolean=} errorDetails
 * @property {Logger=} logger
 */

/**
 * Setup the server for a specific API, so every server can run multiple instances of the API, like different versions, for e.g. different clients
 * @class
 */
export class Api {
  /**
   * @param {ApiSchema} params
   */
  constructor ({ version, specification, controllers, secret, apiRoot, strictSpecification, errorDetails, logger }) {
    this.version = version
    this.specification = specification
    this.controllers = controllers
    this.secret = secret
    this.apiRoot = apiRoot
    this.strictSpecification = strictSpecification
    this.errorDetails = errorDetails || false
    this.logger = logger || console
  }

  setup () {
    const router = express.Router()

    router.use('/swagger', swaggerUi.serve, swaggerUi.setup(this.specification))
    router.get('/api-docs', (_request, response) =>
      response.json(this.specification)
    )

    const { api } = setupRouter({
      secret: this.secret,
      openAPISpecification: this.specification,
      controllers: this.controllers,
      apiRoot: this.apiRoot,
      strictSpecification: this.strictSpecification,
      errorDetails: this.errorDetails,
      logger: this.logger
    })
    api.init()

    router.use((request, response) =>
      api.handleRequest(request, request, response)
    )

    return router
  }
}
