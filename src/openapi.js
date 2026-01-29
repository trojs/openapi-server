/* @ts-self-types="../types/openapi.d.ts" */
import { readFile } from 'node:fs/promises'

/**
 * @typedef {{ file: string; base?: string }} OpenAPIParams
 */

/** @type {(params: OpenAPIParams) => Promise<{ openAPISpecification: object }>} */
export const openAPI = async ({ file, base = import.meta.url }) => {
  const fileUrl = new URL(file, base)
  const openAPISpecification = JSON.parse(await readFile(fileUrl, 'utf8'))
  return { openAPISpecification }
}
