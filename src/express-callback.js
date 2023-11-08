import getStatusByError from './error-status.js'
import { parseParams } from './params.js'

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('openapi-backend').Context} Context
 * @typedef {import('./api.js').Logger} Logger
 * @param {object} params
 * @param {Function} params.controller
 * @param {object} params.specification
 * @param {boolean=} params.errorDetails
 * @param {Logger=} params.logger
 * @returns {(context: object, request: object, response: object) => Promise<any>}
 */
export const makeExpressCallback = ({
  controller,
  specification,
  errorDetails,
  logger
}) =>
/**
 * Handle controller
 * @async
 * @param {Context} context
 * @param {Request} request
 * @param {object} response
 * @returns {Promise<any>}
 */
  async (context, request, response) => {
    try {
      const parameters = parseParams({
        query: context.request.query,
        spec: context.operation.parameters
      })
      const url = `${request.protocol}://${request.get('Host')}${request.originalUrl}`

      return controller({
        context,
        request,
        response,
        parameters,
        specification,
        post: request.body,
        url,
        logger
      })
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
