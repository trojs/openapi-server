export default {
  openapi: '3.0.3',
  paths: {
    '/messages': {
      get: {
        operationId: 'getMessages',
        summary: 'Get all message records',
        description: 'Get all message records from the database.',
        parameters: [
          {
            name: 'size',
            required: false,
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 10,
              default: 10
            }
          },
          {
            name: 'page',
            required: false,
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 0,
              example: 0,
              default: 0
            }
          }
        ],
        responses: {
          200: {
            description: '',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Pagination'
                    },
                    {
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/message'
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: {
            description: 'Unauthorized'
          }
        },
        tags: [
          'Example'
        ],
        security: [
          {
            apiKey: []
          }
        ]
      }
    },
    '/users': {
      get: {
        operationId: 'getUsers',
        summary: 'Get all user records',
        description: 'Get all user records from the database.',
        parameters: [
        ],
        responses: {
          200: {
            description: '',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/Pagination'
                    },
                    {
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/user'
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: {
            description: 'Unauthorized'
          }
        },
        tags: [
          'Example'
        ],
        security: [
          {
            apiKey: []
          }
        ]
      }
    }
  },
  info: {
    title: 'API',
    description: 'Example API',
    version: '1.0',
    contact: {}
  },
  tags: [],
  servers: [
    {
      url: '/'
    }
  ],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      }
    },
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          cursors: {
            type: 'object',
            example: {
              self: 'http://localhost:3000/message?page=2&size=10',
              prev: 'http://localhost:3000/message?page=1&size=10',
              next: 'http://localhost:3000/message?page=3&size=10',
              first: 'http://localhost:3000/message?page=0&size=10',
              last: 'http://localhost:3000/message?page=4&size=10'
            },
            description: 'Pagination cursors'
          },
          total: {
            type: 'number',
            example: 42,
            description: 'Total records'
          },
          pages: {
            type: 'number',
            example: 5,
            description: 'Total pages'
          },
          size: {
            type: 'number',
            example: 10,
            description: 'Page size'
          },
          page: {
            type: 'number',
            example: 1,
            description: 'Current page'
          }
        },
        required: [
          'cursors',
          'total',
          'pages',
          'size',
          'page'
        ]
      },
      message: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 123,
            description: 'Database identifier for the message'
          }
        },
        required: [
          'id'
        ]
      },
      user: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Pieter',
            description: 'User name'
          }
        },
        required: [
          'name'
        ]
      }
    }
  }
}
