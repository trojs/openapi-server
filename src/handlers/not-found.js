export const notFound = (_context, request, response) => {
  if (!response.headersSent) {
    response.status(404)
  }
  return {
    status: 404,
    timestamp: new Date(),
    message: 'Not found'
  }
}
