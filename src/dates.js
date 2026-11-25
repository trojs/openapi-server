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
 * @property {string[]=} required
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

const getJsonType = (value) => {
  if (Array.isArray(value)) {
    return 'array'
  }
  return typeof value
}

const getSchemaTypes = (schema) => {
  const types = [schema.type].flat().filter(Boolean)
  if (types.length > 0) {
    return types
  }
  if (schema.properties || schema.additionalProperties || schema.required) {
    return ['object']
  }
  return schema.items ? ['array'] : []
}

/**
 * Can the branch of a oneOf or anyOf match the (unconverted) value?
 * @param {DateSchema} branch
 * @param {any} value
 * @returns {boolean}
 */
const branchApplies = (branch, value) => {
  const kind = getJsonType(value)
  const types = getSchemaTypes(branch)
  const typeMatches = types.length === 0
    || types.includes(kind)
    || (kind === 'number' && types.includes('integer'))

  return typeMatches
    && (kind !== 'object' || (branch.required ?? []).every((key) => key in value))
}

/**
 * Select the oneOf and anyOf branches to traverse, based on the original value.
 * A string that also fits a non-date branch stays a string.
 * @param {DateSchema} schema
 * @param {any} value
 * @returns {DateSchema[]}
 */
const selectBranches = (schema, value) => {
  const applicable = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])]
    .filter((branch) => branchApplies(branch, value))

  return typeof value === 'string' && applicable.some((branch) => !isDateSchema(branch))
    ? []
    : applicable
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
    ...selectBranches(schema, value)
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
 * Flatten a schema with its allOf, oneOf and anyOf branches.
 * @param {DateSchema=} schema
 * @returns {DateSchema[]}
 */
const expandSchema = (schema) => {
  if (!schema || typeof schema !== 'object') {
    return []
  }
  return [
    schema,
    ...[
      ...(schema.allOf ?? []),
      ...(schema.oneOf ?? []),
      ...(schema.anyOf ?? [])
    ].flatMap(expandSchema)
  ]
}

/**
 * Convert Date and Temporal objects to strings, so a response can be validated
 * against the OpenAPI spec. With a schema, a Date for a `date` field becomes
 * YYYY-MM-DD, other dates are full ISO timestamps. The original value is not mutated.
 * @param {any} value
 * @param {DateSchema=} schema
 * @returns {any}
 */
export const serializeDates = (value, schema) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return value
    }
    const isDateOnly = expandSchema(schema).find(isDateSchema)?.format === 'date'
    const iso = value.toISOString()
    return isDateOnly ? iso.slice(0, 10) : iso
  }

  if (isDateLike(value)) {
    return value.toString()
  }

  const schemas = expandSchema(schema)

  if (Array.isArray(value)) {
    const items = schemas.find((item) => item.items)?.items
    return value.map((item) => serializeDates(item, items))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        const property = schemas.find((entry) => entry.properties?.[key])?.properties[key]
        const additional = schemas.find(
          (entry) => typeof entry.additionalProperties === 'object'
        )?.additionalProperties
        return [key, serializeDates(item, property ?? additional)]
      })
    )
  }

  return value
}

const getMediaType = (contentType) =>
  String(contentType ?? '').split(';')[0].trim().toLowerCase()

/**
 * Select the schema of the media type that matches the content type.
 * An exact match wins over `type/*` and that wins over `*` + `/*`.
 * @param {Record<string, {schema?: DateSchema}>=} content
 * @param {string=} contentType
 * @returns {DateSchema|undefined}
 */
const getContentSchema = (content, contentType) => {
  const mediaType = getMediaType(contentType)
  if (!content || !mediaType) {
    return undefined
  }

  const entries = Object.entries(content)
    .map(([type, value]) => [getMediaType(type), value])
  const wildcard = `${mediaType.split('/')[0]}/*`
  const match = [mediaType, wildcard, '*/*']
    .map((type) => entries.find(([key]) => key === type))
    .find(Boolean)

  return match?.[1]?.schema
}

/**
 * Get the schema of the response of an operation for a status code and content type
 * @param {object=} operation
 * @param {number=} statusCode
 * @param {string=} contentType
 * @returns {DateSchema|undefined}
 */
export const getResponseSchema = (operation, statusCode, contentType) => {
  const { responses = {} } = operation ?? {}
  return getContentSchema(
    (responses[statusCode] ?? responses.default)?.content,
    contentType
  )
}

/**
 * Get the schema of the request body of an operation for the content type of the request
 * @param {object=} operation
 * @param {string=} contentType
 * @returns {DateSchema|undefined}
 */
export const getRequestBodySchema = (operation, contentType) =>
  getContentSchema(operation?.requestBody?.content, contentType)
