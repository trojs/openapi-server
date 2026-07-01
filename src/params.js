import { types } from './types.js'

/**
 * @typedef {object} ParameterSchema
 * @property {string} type
 * @property {string=} format
 */

/**
 * Get a value from an object using dot notation (e.g., "user.name.first")
 * @param {object} obj
 * @param {string} path
 * @returns {any}
 */
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined
  // First check if the exact key exists (for flat query params like 'user.name')
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path]
  }
  // Then try nested path traversal (for nested objects like { user: { name: 'John' } })
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Set a nested value by dot-path while keeping support for flat keys.
 * @param {object} obj
 * @param {string} path
 * @param {any} value
 * @returns {object}
 */
const setNestedValue = (obj, path, value) => {
  if (!obj || !path) return obj

  const next = structuredClone(obj)

  if (Object.prototype.hasOwnProperty.call(next, path)) {
    next[path] = value
    return next
  }

  const keys = path.split('.')
  const last = keys[keys.length - 1]
  let target = next

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]
    const existing = target[key]
    target[key] = existing && typeof existing === 'object' ? existing : {}
    target = target[key]
  }

  target[last] = value
  return next
}

/**
 * Convert a value based on OpenAPI schema type/format.
 * @param {object} params
 * @param {ParameterSchema} params.schema
 * @param {any} params.value
 * @returns {any}
 */
const parseValue = ({ schema, value }) => {
  const {
    type,
    format
  } = schema
  const Type = types[type]

  if (Type === Boolean) {
    if (typeof value === 'boolean') {
      return value
    }
    return JSON.parse(String(value).toLowerCase())
  }

  if (Type === Date || (type === 'string' && (format === 'date' || format === 'date-time'))) {
    return value instanceof Date ? value : new Date(value)
  }

  return new Type(value).valueOf()
}

/**
 * Parse the post body values based on parameter schema definitions.
 * @param {object} params
 * @param {object=} params.post
 * @param {object[]} params.spec
 * @returns {object|undefined}
 */
export const parsePost = ({ post, spec }) => {
  if (!post || typeof post !== 'object') {
    return post
  }

  let parsedPost = structuredClone(post)

  spec.forEach((parameter) => {
    const { name, schema } = parameter
    const rawValue = getNestedValue(post, name)

    if (rawValue === undefined || rawValue === null) {
      return
    }

    const parsedValue = parseValue({ schema, value: rawValue })
    parsedPost = setNestedValue(parsedPost, name, parsedValue)
  })

  return parsedPost
}

/**
 * Parse params to the types defined in the spec
 * @param {object} params
 * @param {object} params.query
 * @param {object} params.post
 * @param {object} params.spec
 * @param {boolean=} params.mock
 * @returns {object}
 */
export const parseParams = ({ query, post, spec, mock = false }) =>
  spec
    .map((parameter) => {
      const { name, schema } = parameter
      const {
        default: defaultValue,
        example: exampleValue
      } = schema
      // Check post first, then query (post data takes precedence)
      // Support nested objects with dot notation
      const paramName = getNestedValue(post, name) ?? getNestedValue(query, name)

      if (!paramName && defaultValue !== undefined) {
        return { name, value: defaultValue }
      }

      if (!paramName && mock && exampleValue !== undefined) {
        return { name, value: exampleValue }
      }

      if (!paramName) {
        return undefined
      }

      const value = parseValue({ schema, value: paramName })
      return { name, value }
    })
    .filter(Boolean)
    .reduce((acc, { name, value }) => {
      acc[name] = value
      return acc
    }, {})
