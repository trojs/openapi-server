/* @ts-self-types="../../types/handlers/unauthorized.d.ts" */
export const unauthorized = (_context, _request, response) => {
  response.status(401)
  return {
    status: 401,
    timestamp: new Date(),
    message: 'Unauthorized'
  }
}
