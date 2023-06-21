import { readFile } from 'node:fs/promises'

/**
 * Get the OpenAPI specification from the file.
 * @async
 * @param {object} params
 * @param {string} params.file
 * @returns {Promise<{ openAPISpecification: object; }>}
 */
const openAPI = async ({ file }) => {
  const fileUrl = new URL(file, import.meta.url)
  const openAPISpecification = JSON.parse(await readFile(fileUrl, 'utf8'))
  return { openAPISpecification }
}

export { openAPI }
