/* @ts-self-types="../types/error-status.d.ts" */
/**
 * @typedef {Error & { status?: number }} StatusError
 */

const errorCodesStatus = [
  {
    type: TypeError,
    status: 422
  },
  {
    type: RangeError,
    status: 404
  },
  {
    type: SyntaxError,
    status: 400
  },
  {
    type: Error,
    status: 500
  }
]

/**
 * Get a http status when you send an error.
 * When it is a error, throw back the error.
 * @param {StatusError} error
 * @returns {number}
 */
export default (error) =>
  error.status
  || errorCodesStatus.find((errorCode) => error instanceof errorCode.type)?.status
  || 500
