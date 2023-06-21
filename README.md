# OpenAPI server

[![NPM version][npm-image]][npm-url] [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=coverage)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) [![Scrutinizer Code Quality][scrutinizer-image]][scrutinizer-url] [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hckrnews_openapi-server&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hckrnews_openapi-server) 
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
    getTest: () => ({ // connect to a openationId in the OpenAPI spec with the same name
        test: 'ok'
    })
}

const { app } = await setupServer({
  env: process.env,
  specFileLocation: './openapi-spec.json',
  controllers
})

```

[npm-url]: https://www.npmjs.com/package/@hckrnews/openapi-server
[npm-image]: https://img.shields.io/npm/v/@hckrnews/openapi-server.svg
[scrutinizer-url]: https://scrutinizer-ci.com/g/hckrnews/openapi-server/?branch=main
[scrutinizer-image]: https://scrutinizer-ci.com/g/hckrnews/openapi-server/badges/quality-score.png?b=main
