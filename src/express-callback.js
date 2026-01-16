import { hrtime } from 'node:process'
import getStatusByError from './error-status.js'
import { parseParams } from './params.js'

/**
 * @typedef {import('express-serve-static-core').Request} Request
 * @typedef {import('express-serve-static-core').Response} Response
 * @typedef {import('openapi-backend').Context} Context
 * @typedef {import('./api.js').Logger} Logger
 */

/**
 * Make an express callback for the controller
 * @param {object} params
 * @param {Function} params.controller
 * @param {object} params.specification
 * @param {boolean=} params.errorDetails
 * @param {Logger=} params.logger
 * @param {object=} params.meta
 * @param {boolean=} params.mock
 * @returns {Function}
 */
export const makeExpressCallback
  = ({ controller, specification, errorDetails, logger, meta, mock }) =>
    /**
     * Handle controller
     * @async
     * @param {Context} context
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<any>}
     */
    async (context, request, response) => {
      const startTime = hrtime()
      try {
        const allParameters = {
          ...(context.request?.params || {}),
          ...(context.request?.query || {})
        }
        const parameters = parseParams({
          query: allParameters,
          spec: context.operation.parameters,
          mock
        })
        const url = `${request.protocol}://${request.get('Host')}${request.originalUrl}`

        const ipHeader = request.headers?.['x-forwarded-for']
        const ipString = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader
        const ip = ipString
          ? ipString.split(',')[0].trim()
          : (request.socket?.remoteAddress || request.ip || '-')
        const { method } = request
        const userAgent = request.headers?.['user-agent'] || request.get('user-agent') || '-'

        const feedback = {
          context,
          request,
          response,
          parameters,
          specification,
          post: request.body,
          url,
          logger,
          meta
        }

        const responseBody = await controller(feedback)
        const responseTime = hrtime(startTime)[1] / 1000000 // convert to milliseconds

        logger.debug({
          url,
          parameters,
          post: request.body,
          response: responseBody,
          method,
          ip,
          userAgent,
          responseTime,
          statusCode: response.statusCode || 200,
          message: 'access'
        })

        return responseBody
      } catch (error) {
        const errorCodeStatus = getStatusByError(error)

        if (errorCodeStatus >= 500) {
          logger.error(error)
        } else {
          logger.warn(error)
        }

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
          errors: error.errors || error.value?.errors,
          status: errorCodeStatus,
          timestamp: new Date(),
          message: error.message
        }
      }
    }
