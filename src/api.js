import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { setupRouter } from './router.js'

/**
 * @typedef {object} ApiSchema
 * @property {string} version
 * @property {object} specification
 * @property {object} controllers
 * @property {string=} secret
 * @property {string=} apiRoot
 * @property {boolean=} strictSpecification
 */

/**
 * Setup the server for a specific API, so every server can run multiple instances of the API, like different versions, for e.g. different clients
 * @class
 */
export class Api {
  /**
   * @param {ApiSchema} params
   */
  constructor ({ version, specification, controllers, secret, apiRoot, strictSpecification }) {
    this.version = version
    this.specification = specification
    this.controllers = controllers
    this.secret = secret
    this.apiRoot = apiRoot
    this.strictSpecification = strictSpecification
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
      strictSpecification: this.strictSpecification
    })
    api.init()

    router.use((request, response) =>
      api.handleRequest(request, request, response)
    )

    return router
  }
}
