import getStatusByError from './error-status.js'
import { parseParams } from './params.js'

/**
 * @typedef {import('express-serve-static-core').Request} Request
 * @typedef {import('express-serve-static-core').Response} Response
 * @typedef {import('openapi-backend').Context} Context
 * @typedef {import('./api.js').Logger} Logger
 * @param {object} params
 * @param {Function} params.controller
 * @param {object} params.specification
 * @param {boolean=} params.errorDetails
 * @param {Logger=} params.logger
 * @param {object=} params.meta
 * @returns {(context: object, request: object, response: object) => Promise<any>}
 */
export const makeExpressCallback = ({
  controller,
  specification,
  errorDetails,
  logger,
  meta
}) =>
/**
 * Handle controller
 * @async
 * @param {Context} context
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<any>}
 */
  async (context, request, response) => {
    try {
      const allParameters = {
        ...(context.request?.params || {}),
        ...(context.request?.query || {})
      }
      const parameters = parseParams({
        query: allParameters,
        spec: context.operation.parameters
      })
      const url = `${request.protocol}://${request.get('Host')}${request.originalUrl}`

      const responseBody = await controller({
        context,
        request,
        response,
        parameters,
        specification,
        post: request.body,
        url,
        logger,
        meta
      })
      logger.debug({
        url,
        parameters,
        post: request.body,
        response: responseBody
      })

      return responseBody
    } catch (error) {
      const errorCodeStatus = getStatusByError(error)

      logger.error(error)

      response.status(errorCodeStatus)

      if (errorDetails) {
        return {
          errors: [
            {
              message: error.message,
              value: error.valueOf(),
              type: error.constructor.name
            }
          ],
          status: errorCodeStatus,
          timestamp: new Date(),
          message: error.message
        }
      }

      return {
        status: errorCodeStatus,
        timestamp: new Date(),
        message: error.message
      }
    }
  }
