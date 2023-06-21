import { readFile } from 'node:fs/promises'

const openAPI = async ({ file }) => {
  const fileUrl = new URL(file, import.meta.url)
  const openAPISpecification = JSON.parse(await readFile(fileUrl, 'utf8'))
  return { openAPISpecification }
}

export { openAPI }
