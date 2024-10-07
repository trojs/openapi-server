import { types } from './types.js';

/**
 * Parse params to the types defined in the spec
 * @param {object} params
 * @param {object} params.query
 * @param {object} params.spec
 * @param {boolean=} params.mock
 * @returns {object}
 */
export const parseParams = ({ query, spec, mock = false }) =>
    spec
        .map((parameter) => {
            const { name, schema } = parameter;
            const {
                type,
                default: defaultValue,
                example: exampleValue,
            } = schema;
            const Type = types[type];
            const paramName = query?.[name];

            if (!paramName && defaultValue !== undefined) {
                return { name, value: defaultValue };
            }

            if (!paramName && mock && exampleValue !== undefined) {
                return { name, value: exampleValue };
            }

            if (!paramName) {
                return undefined;
            }

            if (Type === Boolean) {
                return {
                    name,
                    value: JSON.parse(paramName.toLowerCase()),
                };
            }

            const value = new Type(paramName).valueOf();
            return { name, value };
        })
        .filter(Boolean)
        .reduce((acc, { name, value }) => {
            acc[name] = value;
            return acc;
        }, {});
