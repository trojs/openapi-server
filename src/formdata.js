import formDataParser from '@trojs/formdata-parser'

/**
 * @typedef {import('@trojs/formdata-parser').FormData} FormData
 * @typedef {import('node:http').IncomingHttpHeaders} IncomingHttpHeaders
 *
 * Parse form data
 * @param {Buffer|string} data
 * @param {IncomingHttpHeaders} headers
 * @returns {FormData[]}
 */
export const parseFormData = (data, headers) => {
  const contentType = headers?.['content-type']
  if (contentType?.startsWith('multipart/form-data')) {
    const dataString = data.toString('utf8')
    console.log('parse form data')
    return formDataParser(dataString, contentType)
  }
  return []
}
