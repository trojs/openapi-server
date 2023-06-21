import { OpenAPIBackend } from 'openapi-backend'
import getStatusByError from './error-status.js'
import { parseParams } from './params.js'

const makeExpressCallback = ({
  controller,
  specification
}) =>
/**
 * Handle controller
 * @async
 * @param {object} context
 * @param {object} request
 * @param {object} response
 * @returns {Promise<any>}
 */
  async (context, request, response) => {
    const parameters = parseParams({
      query: context.request.query,
      spec: context.operation.parameters
    })
    try {
      return controller({
        context,
        request,
        response,
        parameters,
        specification
      })
    } catch (error) {
      const errorCodeStatus = getStatusByError(error)
      response.status(errorCodeStatus)
      return {
        status: errorCodeStatus,
        timestamp: new Date(),
        message: error.message
      }
    }
  }

const operations = ['get', 'put', 'patch', 'post', 'delete']

/**
 * Get all operation ID's from the specification.
 * @param {object} params
 * @param {object} params.specification
 * @returns {string[]}
 */
const operationIds = ({ specification }) => Object.values(specification.paths)
  .map((path) => Object.entries(path)
    .map(([operation, data]) => operations.includes(operation)
      ? data.operationId
      : null))
  .flat()

/**
 * Setup the router
 * @param {object} params
 * @param {object} params.env
 * @param {object} params.openAPISpecification
 * @param {object} params.controllers
 * @returns {{ api, openAPISpecification: object }}
 */
const setupRouter = ({ env, openAPISpecification, controllers }) => {
  const secret = env.SECRET

  const api = new OpenAPIBackend({ definition: openAPISpecification })

  api.register({
    unauthorizedHandler: async (context, request, response) => {
      response.status(401)
      return {
        status: 401,
        timestamp: new Date(),
        message: 'Unauthorized'
      }
    },
    // Request validation
    validationFail: (context, request, response) => {
      response.status(400)
      return {
        errors: context.validation.errors,
        status: 400,
        timestamp: new Date(),
        message: 'Bad Request'
      }
    },
    notFound: (_context, request, response) => {
      response.status(404)
      return {
        status: 404,
        timestamp: new Date(),
        message: 'Not found'
      }
    },
    // Response validation
    postResponseHandler: (context, request, response) => {
      const responseDoesntNeedValidation = response.statusCode >= 400
      if (responseDoesntNeedValidation) {
        return response.json(context.response)
      }

      const valid = context.api.validateResponse(
        context.response,
        context.operation
      )
      if (valid?.errors) {
        return response.status(502).json({
          errors: valid.errors,
          status: 502,
          timestamp: new Date(),
          message: 'Bad response'
        })
      }

      return response.json(context.response)
    }
  })

  operationIds({ specification: openAPISpecification }).forEach((operationId) => {
    api.register(
      operationId,
      makeExpressCallback({
        controller: controllers[operationId],
        specification: openAPISpecification
      })
    )
  })

  api.registerSecurityHandler(
    'apiKey',
    (context) => context.request.headers['x-api-key'] === secret
  )

  return { api, openAPISpecification }
}

export { setupRouter }
