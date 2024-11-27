export const notFound = (_context, request, response) => {
    response.status(404)
    return {
        status: 404,
        timestamp: new Date(),
        message: 'Not found'
    }
}
