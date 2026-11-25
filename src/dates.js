/**
 * @typedef {object} DateSchema
 * @property {string|string[]=} type
 * @property {string=} format
 * @property {Record<string, DateSchema>=} properties
 * @property {DateSchema|boolean=} additionalProperties
 * @property {DateSchema=} items
 * @property {DateSchema[]=} allOf
 * @property {DateSchema[]=} oneOf
 * @property {DateSchema[]=} anyOf
 */

/**
 * Is the value a Date or a Temporal object?
 * @param {any} value
 * @returns {boolean}
 */
export const isDateLike = (value) =>
  value instanceof Date
  || (
    typeof value === 'object'
    && value !== null
    && Object.prototype.toString.call(value).startsWith('[object Temporal.')
  )

/**
 * Is the schema a string with a date or date-time format?
 * @param {DateSchema} schema
 * @returns {boolean}
 */
const isDateSchema = (schema) => {
  const types = [schema.type].flat()
  return types.includes('string')
    && (schema.format === 'date' || schema.format === 'date-time')
}

/**
 * Parse a date string.
 * Uses Temporal when it is available (PlainDate for `date`, Instant for `date-time`),
 * otherwise it falls back to Date.
 * @param {object} params
 * @param {any} params.value
 * @param {string=} params.format
 * @returns {any}
 */
export const parseDate = ({ value, format = 'date-time' }) => {
  if (isDateLike(value)) {
    return value
  }

  const { Temporal } = globalThis
  if (!Temporal) {
    return new Date(value)
  }

  return format === 'date'
    ? Temporal.PlainDate.from(value)
    : Temporal.Instant.from(value)
}

const isPlainObject = (value) => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Parse all date and date-time strings in a value, based on a schema.
 * The original value is not mutated.
 * @param {object} params
 * @param {any} params.value
 * @param {DateSchema=} params.schema
 * @returns {any}
 */
export const parseSchemaDates = ({ value, schema }) => {
  if (!schema || typeof schema !== 'object' || value === undefined || value === null) {
    return value
  }

  const result = [
    ...(schema.allOf ?? []),
    ...(schema.oneOf ?? []),
    ...(schema.anyOf ?? [])
  ].reduce(
    (current, subSchema) => parseSchemaDates({ value: current, schema: subSchema }),
    value
  )

  if (typeof result === 'string') {
    return isDateSchema(schema)
      ? parseDate({ value: result, format: schema.format })
      : result
  }

  if (Array.isArray(result)) {
    return result.map((item) => parseSchemaDates({ value: item, schema: schema.items }))
  }

  if (isPlainObject(result)) {
    const { properties = {}, additionalProperties } = schema
    const fallback = typeof additionalProperties === 'object'
      ? additionalProperties
      : undefined

    return Object.fromEntries(
      Object.entries(result).map(([key, item]) => [
        key,
        parseSchemaDates({ value: item, schema: properties[key] ?? fallback })
      ])
    )
  }

  return result
}

/**
 * Convert Date and Temporal objects to strings, so a response can be validated
 * against the OpenAPI spec. The original value is not mutated.
 * @param {any} value
 * @returns {any}
 */
export const serializeDates = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : value.toISOString()
  }

  if (isDateLike(value)) {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeDates)
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeDates(item)])
    )
  }

  return value
}

/**
 * Get the JSON schema of the request body of an operation
 * @param {object=} operation
 * @returns {DateSchema|undefined}
 */
export const getRequestBodySchema = (operation) => {
  const content = operation?.requestBody?.content
  if (!content) {
    return undefined
  }
  const mediaType = Object.keys(content).find((type) => /json/i.test(type))
  return mediaType ? content[mediaType]?.schema : undefined
}
