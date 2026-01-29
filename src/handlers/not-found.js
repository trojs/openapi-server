/* @ts-self-types="../../types/handlers/not-found.d.ts" */
export const notFound = (_context, _request, response) => {
  response.status(404)
  return {
    status: 404,
    timestamp: new Date(),
    message: 'Not found'
  }
}
