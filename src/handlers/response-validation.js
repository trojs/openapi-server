export default (logger, validateResponse) => (context, request, response) => {
  // Prevent sending response if headers are already sent (e.g., after redirect)
  if (response.headersSent) {
    return undefined
  }

  const responseDoesntNeedValidation = response.statusCode >= 400
  if (responseDoesntNeedValidation) {
    return response.json(context.response)
  }

  const valid = validateResponse
    ? (
        context.api.validateResponse(
          context.response,
          context.operation
        )
      )
    : null
  if (valid?.errors) {
    if (logger) {
      try {
        logger.error({
          message: 'Response validation failed',
          errors: valid.errors,
          operation: context.operation,
          statusCode: response.statusCode,
          response: context.response
        })
      } catch (logError) {
        // Prevent logging errors from affecting the response
        console.error('Logger failed:', logError)
      }
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

  if (!context.response) {
    return response.end()
  }

  const contentType = request?.headers?.accept ?? 'application/json'
  if (contentType === 'application/json') {
    return response.json(context.response)
  }

  return response.send(context.response)
}
