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

    const contentType = request?.headers?.accept ?? 'application/json'
    if (contentType === 'application/json') {
        return response.json(context.response)
    }

    return response.send(context.response)
}
