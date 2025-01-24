import { OpenAPIBackend } from 'openapi-backend'
import addFormats from 'ajv-formats'
import { makeExpressCallback } from './express-callback.js'
import { operationIds } from './operation-ids.js'
import { notFound } from './handlers/not-found.js'
import { requestValidation } from './handlers/request-validation.js'
import { responseValidation } from './handlers/response-validation.js'
import { unauthorized } from './handlers/unauthorized.js'

/**
 * @typedef {import('./api.js').Logger} Logger
 * @typedef {import('./api.js').SecurityHandler} SecurityHandler
 * @typedef {import('./api.js').Handler} Handler
 * @typedef {import('ajv').Options} AjvOpts
 * @typedef {import('openapi-backend').AjvCustomizer} AjvCustomizer
 */

/**
 * Setup the router
 * @param {object} params
 * @param {object} params.openAPISpecification
 * @param {object} params.controllers
 * @param {string=} params.apiRoot
 * @param {boolean=} params.strictSpecification
 * @param {boolean=} params.errorDetails
 * @param {Logger=} params.logger
 * @param {object=} params.meta
 * @param {SecurityHandler[]=} params.securityHandlers
 * @param {Handler=} params.unauthorizedHandler
 * @param {AjvOpts=} params.ajvOptions
 * @param {AjvCustomizer=} params.customizeAjv
 * @param {boolean=} params.mock
 * @returns {{ api: OpenAPIBackend<any>, openAPISpecification: object }}
 */
export const setupRouter = ({
    openAPISpecification,
    controllers,
    apiRoot,
    strictSpecification,
    errorDetails,
    logger,
    meta,
    securityHandlers = [],
    unauthorizedHandler,
    ajvOptions = {},
    customizeAjv,
    mock
}) => {
    const ajvWithExtraFormats = (originalAjv) => {
        addFormats(originalAjv)
        return originalAjv
    }
    const api = new OpenAPIBackend({
        definition: openAPISpecification,
        apiRoot,
        strict: strictSpecification,
        ajvOpts: ajvOptions,
        customizeAjv: customizeAjv || ajvWithExtraFormats
    })

    api.register({
        unauthorizedHandler: unauthorizedHandler || unauthorized,
        validationFail: requestValidation,
        notFound,
        postResponseHandler: responseValidation
    })

    operationIds({ specification: openAPISpecification }).forEach(
        (operationId) => {
            if (!Object.hasOwn(controllers, operationId)) {
                return
            }
            api.register(
                operationId,
                makeExpressCallback({
                    controller: controllers[operationId],
                    specification: openAPISpecification,
                    errorDetails,
                    logger,
                    meta,
                    mock
                })
            )
        }
    )

    api.register('notImplemented', (context) => {
        const { mock: mockImplementation } =
            context.api.mockResponseForOperation(context.operation.operationId)
        return mockImplementation
    })

    securityHandlers.forEach((securityHandler) => {
        api.registerSecurityHandler(
            securityHandler.name,
            securityHandler.handler
        )
    })

    return { api, openAPISpecification }
}
