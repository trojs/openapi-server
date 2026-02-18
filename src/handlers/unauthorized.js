export const unauthorized = async (context, request, response) => {
  if (!response.headersSent) {
    response.status(401)
  }
  return {
    status: 401,
    timestamp: new Date(),
    message: 'Unauthorized'
  }
}
