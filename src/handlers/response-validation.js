export const responseValidation = (context, request, response) => {
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

  if (!context.response) {
    return response.end()
  }

  response.format({
    'text/plain': () => {
      response.send(context.response)
    },

    'application/json': () => {
      response.json(context.response)
    },

    default: () => {
      response.send(context.response)
    }
  })
}
