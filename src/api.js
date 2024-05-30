import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { setupRouter } from './router.js'

/**
 * @typedef {import('openapi-backend').Handler} Handler
 * @typedef {object} Logger
 * @property {Function} error
 * @property {Function} warn
 * @property {Function} info
 * @property {Function} debug
 * @typedef {object} SecurityHandler
 * @property {string} name
 * @property {Handler} handler
 * @typedef {object} ApiSchema
 * @property {string} version
 * @property {object} specification
 * @property {object} controllers
 * @property {string=} secret
 * @property {string=} apiRoot
 * @property {boolean=} strictSpecification
 * @property {boolean=} errorDetails
 * @property {Logger=} logger
 * @property {object=} meta
 * @property {SecurityHandler[]=} securityHandlers
 * @property {boolean=} swagger
 * @property {boolean=} apiDocs
 */

/**
 * Setup the server for a specific API, so every server can run multiple instances of the API, like different versions, for e.g. different clients
 * @class
 */
export class Api {
  /**
   * @param {ApiSchema} params
   */
  constructor ({ version, specification, controllers, secret, apiRoot, strictSpecification, errorDetails, logger, meta, securityHandlers, swagger, apiDocs }) {
    this.version = version
    this.specification = specification
    this.controllers = controllers
    this.secret = secret
    this.apiRoot = apiRoot
    this.strictSpecification = strictSpecification
    this.errorDetails = errorDetails || false
    this.logger = logger || console
    this.meta = meta || {}
    this.securityHandlers = securityHandlers || []
    this.swagger = swagger ?? true
    this.apiDocs = apiDocs ?? true
  }

  setup () {
    const router = express.Router()

    if (this.swagger) {
      router.use('/swagger', swaggerUi.serveFiles(this.specification, {}), swaggerUi.setup(this.specification))
    }
    if (this.apiDocs) {
      router.get('/api-docs', (_request, response) =>
        response.json(this.specification)
      )
    }

    const { api } = setupRouter({
      secret: this.secret,
      openAPISpecification: this.specification,
      controllers: this.controllers,
      apiRoot: this.apiRoot,
      strictSpecification: this.strictSpecification,
      errorDetails: this.errorDetails,
      logger: this.logger,
      meta: this.meta,
      securityHandlers: this.securityHandlers
    })
    api.init()

    router.use((request, response) =>
      api.handleRequest(request, request, response)
    )

    return router
  }
}
