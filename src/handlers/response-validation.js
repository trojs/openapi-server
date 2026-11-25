import { getResponseSchema, serializeDates } from '../dates.js'

export default (logger, validateResponse) => (context, request, response) => {
  // Prevent sending response if headers are already sent (e.g., after redirect)
  if (response.headersSent) {
    return undefined
  }

  const responseDoesntNeedValidation = response.statusCode >= 400
  if (responseDoesntNeedValidation) {
    return response.json(context.response)
  }

  const body = serializeDates(
    context.response,
    getResponseSchema(
      context.operation,
      response.statusCode,
      response.getHeader?.('content-type') ?? 'application/json'
    )
  )

  const valid = validateResponse
    ? (
        context.api.validateResponse(body, context.operation)
      )
    : null
  if (valid?.errors) {
    if (logger) {
      logger.error({
        message: 'Response validation failed',
        errors: valid.errors,
        operation: context.operation,
        statusCode: response.statusCode,
        response: context.response
      })
    }
    if (!response.headersSent) {
      return response.status(502).json({
        errors: valid.errors,
        status: 502,
        timestamp: new Date(),
        message: 'Bad response'
      })
    }
    return undefined
  }

  if (!body) {
    return response.end()
  }

  const contentType = request?.headers?.accept ?? 'application/json'
  if (contentType === 'application/json') {
    return response.json(body)
  }

  return response.send(body)
}
