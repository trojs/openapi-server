export default (logger, validateResponse) => (context, request, response) => {
  // Prevent sending headers if they're already sent
  if (response.headersSent) {
    return response.end()
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
    return response.end()
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
