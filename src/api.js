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
 * @property {Function=} preLog
 * @property {Function=} postLog
 * @property {object=} meta
 * @property {SecurityHandler[]=} securityHandlers
 * @property {Handler=} unauthorizedHandler
 * @property {boolean=} swagger
 * @property {boolean=} apiDocs
 * @property {AjvOpts=} ajvOptions
 * @property {AjvCustomizer=} customizeAjv
 * @property {any[]=} middleware
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
  constructor ({
    version,
    specification,
    controllers,
    apiRoot,
    strictSpecification,
    errorDetails,
    logger,
    preLog,
    postLog,
    meta,
    securityHandlers,
    unauthorizedHandler,
    swagger,
    apiDocs,
    ajvOptions,
    customizeAjv,
    middleware = []
  }) {
    this.version = version
    this.specification = specification
    this.controllers = controllers
    this.apiRoot = apiRoot
    this.strictSpecification = strictSpecification
    this.errorDetails = errorDetails || false
    this.logger = logger || console
    this.preLog = preLog || undefined
    this.postLog = postLog || undefined
    this.meta = meta || {}
    this.securityHandlers = securityHandlers || []
    this.unauthorizedHandler = unauthorizedHandler || undefined
    this.swagger = swagger ?? true
    this.apiDocs = apiDocs ?? true
    this.ajvOptions = ajvOptions ?? { allErrors: false }
    this.customizeAjv = customizeAjv
    this.middleware = middleware
  }

  setup () {
    const router = express.Router()

    if (this.swagger) {
      router.use(
        '/swagger',
        swaggerUi.serveFiles(this.specification, {}),
        swaggerUi.setup(this.specification)
      )
    }

    if (this.apiDocs) {
    // Generate an ETag for the specification (simple hash or JSON string)
      const apiDocsString = JSON.stringify(this.specification)
      const etag = `"${Buffer.from(apiDocsString).toString('base64')}"`

      router.get('/api-docs', (request, response) => {
        // Check for If-None-Match header
        const ifNoneMatchHeader = request.headers['if-none-match']
        if (ifNoneMatchHeader) {
          const etags = ifNoneMatchHeader.split(',').map((tag) => tag.trim())
          if (etags.includes('*') || etags.includes(etag)) {
            response.status(304).end()
            return
          }
        }
        response.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate')
        response.setHeader('ETag', etag)
        response.json(this.specification)
      })
    }

    const { api } = setupRouter({
      openAPISpecification: this.specification,
      controllers: this.controllers,
      apiRoot: this.apiRoot,
      strictSpecification: this.strictSpecification,
      errorDetails: this.errorDetails,
      logger: this.logger,
      preLog: this.preLog,
      postLog: this.postLog,
      meta: this.meta,
      securityHandlers: this.securityHandlers,
      unauthorizedHandler: this.unauthorizedHandler,
      ajvOptions: this.ajvOptions,
      customizeAjv: this.customizeAjv
    })
    api.init()
    this.middleware.forEach((fn) => router.use(fn))
    router.use((request, response) =>
      api.handleRequest(request, request, response)
    )

    return router
  }
}
