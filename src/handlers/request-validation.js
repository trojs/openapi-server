export const requestValidation = (context, request, response) => {
    response.status(400)
    return {
        errors: context.validation.errors,
        status: 400,
        timestamp: new Date(),
        message: 'Bad Request'
    }
}
