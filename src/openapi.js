import { readFile } from 'node:fs/promises'

/**
 * Get the OpenAPI specification from the file.
 * @async
 * @param {object} params
 * @param {string} params.file
 * @param {string=} params.base
 * @returns {Promise<{ openAPISpecification: object; }>}
 */
export const openAPI = async ({ file, base = import.meta.url }) => {
    const fileUrl = new URL(file, base)
    const openAPISpecification = JSON.parse(await readFile(fileUrl, 'utf8'))
    return { openAPISpecification }
}
