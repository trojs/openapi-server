const operations = ['get', 'put', 'patch', 'post', 'delete']

/**
 * Get all operation ID's from the specification.
 * @param {object} params
 * @param {object} params.specification
 * @returns {string[]}
 */
export const operationIds = ({ specification }) =>
  Object.values(specification.paths)
    .map((path) =>
      Object.entries(path).map(([operation, data]) =>
        operations.includes(operation) ? data.operationId : null
      )
    )
    .flat()
