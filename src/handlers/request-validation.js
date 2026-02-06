/* @ts-self-types="../../types/handlers/request-validation.d.ts" */
export const requestValidation = (context, _request, response) => {
  response.status(400)
  return {
    errors: context.validation.errors,
    status: 400,
    timestamp: new Date(),
    message: 'Bad Request'
  }
}
