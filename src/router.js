import { OpenAPIBackend } from 'openapi-backend'

const setupRouter = ({ env, openAPISpecification, controllers }) => {
  const secret = env.SECRET

  const api = new OpenAPIBackend({ definition: openAPISpecification })

  api.register({
    ...controllers,
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
  api.registerSecurityHandler(
    'apiKey',
    (context) => context.request.headers['x-api-key'] === secret
  )

  return { api, openAPISpecification }
}

export { setupRouter }
