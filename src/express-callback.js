import getStatusByError from './error-status.js'
import { parseParams } from './params.js'

/**
 *
 * @param {object} params
 * @param {Function} params.controller
 * @param {object} params.specification
 * @returns {(context: object, request: object, response: object) => Promise<any>}
 */
export const makeExpressCallback = ({
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
    const url = `${request.protocol}://${request.get('Host')}${request.originalUrl}`

    try {
      return controller({
        context,
        request,
        response,
        parameters,
        specification,
        url
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
