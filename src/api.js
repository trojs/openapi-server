import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { setupRouter } from './router.js'

/**
 * @typedef {import('openapi-backend').Handler} Handler
 * @typedef {import('ajv').Options} AjvOpts
 * @typedef {import('openapi-backend').AjvCustomizer} AjvCustomizer
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
 * @property {string=} apiRoot
 * @property {boolean=} strictSpecification
 * @property {boolean=} errorDetails
 * @property {Logger=} logger
 * @property {object=} meta
 * @property {SecurityHandler[]=} securityHandlers
 * @property {Handler=} unauthorizedHandler
 * @property {boolean=} swagger
 * @property {boolean=} apiDocs
 * @property {AjvOpts=} ajvOptions
 * @property {AjvCustomizer=} customizeAjv
 */

/**
 * Setup the server for a specific API, so every server can run multiple instances of the API,
 * like different versions, for e.g. different clients
 */

export class Api {
  /**
   * Create a new instance of the API
   * @class
   * @param {ApiSchema} params
   */
  constructor({
    version,
    specification,
    controllers,
    apiRoot,
    strictSpecification,
    errorDetails,
    logger,
    meta,
    securityHandlers,
    unauthorizedHandler,
    swagger,
    apiDocs,
    ajvOptions,
    customizeAjv
  }) {
    this.version = version
    this.specification = specification
    this.controllers = controllers
    this.apiRoot = apiRoot
    this.strictSpecification = strictSpecification
    this.errorDetails = errorDetails || false
    this.logger = logger || console
    this.meta = meta || {}
    this.securityHandlers = securityHandlers || []
    this.unauthorizedHandler = unauthorizedHandler || undefined
    this.swagger = swagger ?? true
    this.apiDocs = apiDocs ?? true
    this.ajvOptions = ajvOptions ?? { allErrors: false }
    this.customizeAjv = customizeAjv
  }

  setup() {
    const router = express.Router()

    if (this.swagger) {
      router.use(
        '/swagger',
        swaggerUi.serveFiles(this.specification, {}),
        swaggerUi.setup(this.specification)
      )
    }
    if (this.apiDocs) {
      router.get('/api-docs', (_request, response) =>
        response.json(this.specification)
      )
    }

    const { api } = setupRouter({
      openAPISpecification: this.specification,
      controllers: this.controllers,
      apiRoot: this.apiRoot,
      strictSpecification: this.strictSpecification,
      errorDetails: this.errorDetails,
      logger: this.logger,
      meta: this.meta,
      securityHandlers: this.securityHandlers,
      unauthorizedHandler: this.unauthorizedHandler,
      ajvOptions: this.ajvOptions,
      customizeAjv: this.customizeAjv
    })
    api.init()

    router.use((request, response) =>
      api.handleRequest(request, request, response)
    )

    return router
  }
}
