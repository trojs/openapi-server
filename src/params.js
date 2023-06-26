import { types } from './types.js'

/**
 * Parse params to the types defined in the spec
 * @param {object} params
 * @param {object} params.query
 * @param {object} params.spec
 * @returns {object}
 */
export const parseParams = ({ query, spec }) =>
  spec.map(parameter => {
    const { name, schema, example: exampleValue } = parameter
    const { type, default: defaultValue } = schema
    const Type = types[type]
    const paramName = query?.[name]

    if (paramName) {
      const value = new Type(paramName).valueOf()
      return { name, value }
    }

    return { name, value: defaultValue ?? exampleValue }
  })
    .reduce((acc, { name, value }) => {
      acc[name] = value
      return acc
    }, {})
