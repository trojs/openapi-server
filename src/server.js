import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { setupRouter } from './router.js'
import { openAPI } from './openapi.js'

const setupServer = async ({ env, specFileLocation, controllers }) => {
  const { openAPISpecification } = await openAPI({ file: specFileLocation })
  const { api } = setupRouter({
    env,
    openAPISpecification,
    controllers
  })
  api.init()
  const app = express()
  // todo: cors, compression, helmet, ...
  app.use(express.json())
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openAPISpecification))
  app.get('/api-docs', (_request, response) =>
    response.json(openAPISpecification)
  )
  app.use((request, response) =>
    api.handleRequest(request, request, response)
  )

  return { app }
}

export { setupServer }
