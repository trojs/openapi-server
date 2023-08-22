# OpenAPI server

[![NPM version][npm-image]][npm-url] [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=coverage)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) 
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=bugs)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server)

Create easy a webserver API first with a OpenAPI spec.

## Installation

`npm install @hckrnews/openapi-server`
or
`yarn add @hckrnews/openapi-server`

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

const { openAPISpecification } = await openAPI({ file: './openapi-spec.json', base })
const { app } = await setupServer({
  env: process.env,
  openAPISpecification,
  controllers
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


[npm-url]: https://www.npmjs.com/package/@hckrnews/openapi-server
[npm-image]: https://img.shields.io/npm/v/@hckrnews/openapi-server.svg
