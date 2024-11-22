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
export const makeExpressCallback =
    ({ controller, specification, errorDetails, logger, meta, mock }) =>
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
                    spec: context.operation.parameters,
                    mock
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
                    status: errorCodeStatus,
                    timestamp: new Date(),
                    message: error.message
                }
            }
        }
