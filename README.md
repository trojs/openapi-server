# OpenAPI server

[![NPM version][npm-image]][npm-url] [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=coverage)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) 
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=bugs)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server)

Create easy a webserver API first with a OpenAPI spec.

## Installation

`npm install @trojs/openapi-server`
or
`yarn add @trojs/openapi-server`

## Test the package

`npm run test`
or
`yarn test`

## How to use

```javascript

const controllers = {
    // connect to a openationId in the OpenAPI spec with the same name
    getTest: ({
        context,
        request,
        response,
        parameters,
        specification,
        url
      }) => ({ //response an object
        test: 'ok'
    })
}

const { openAPISpecification, Api } = await openAPI({ file: './openapi-spec.json', base })
const api = new Api({
  version: 'v1',
  specification: openAPISpecification,
  controllers,
  secret: 'test',
  logger: console
})
const { app } = await setupServer({
  env: process.env,
  apis: [api]
})

```

If you create a controller, you can easy connect it to the operationId in the OpenAPI spec.
Check also the examples in the test files.
In your controller you can use e.g. context, request and response, from express.
It isn neccesary to define it in your controller, if you don't use it, you can remove it.
e.g.
```javascript
getTest: ({ parameters }) => 
    {
        return {
            test: 'ok'
        }
    }
```

parameters are query param's from the url of a get request, parsed by the type defined in the OpenAPI spec.

Specifications is the OpenAPI spec.

Url is the current url.


## Add custom security handlers like JWT
```javascript
import jwt from 'jsonwebtoken'

function jwtHandler(context, request, response) {
  const authHeader = context.request.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  const token = authHeader.replace('Bearer ', '');
  return jwt.verify(token, 'secret');
}

const securityHandlers = [
  {
    name: 'jwt',
    handler: jwtHandler
  }
]

const api = new Api({
  version: 'v1',
  specification: openAPISpecification,
  controllers,
  securityHandlers
})
```

See also: https://openapistack.co/docs/openapi-backend/security-handlers/#security-handlers


[npm-url]: https://www.npmjs.com/package/@trojs/openapi-server
[npm-image]: https://img.shields.io/npm/v/@trojs/openapi-server.svg
