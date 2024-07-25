import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import { setupServer, openAPI, Api } from './server.js';

const envExample = {
    PORT: 3000,
};

const specFileLocation = './__fixtures__/spec-no-auth.json';

const exampleResponse = {
    cursors: {
        first: 'http://localhost:3000/stock?page=0&size=10',
        last: 'http://localhost:3000/stock?page=4&size=10',
        next: 'http://localhost:3000/stock?page=3&size=10',
        prev: 'http://localhost:3000/stock?page=1&size=10',
        self: 'http://localhost:3000/stock?page=2&size=10',
    },
    items: [
        {
            id: 123,
        },
    ],
    page: 0,
    pages: 0,
    size: 0,
    total: 0,
};

const controllers = {
    getMessages: () => exampleResponse,
    getUsers: () => {
        throw new TypeError('test');
    },
    getUserSecure: ({ context }) => context.security.customSecurityHandler,
};

const { openAPISpecification } = await openAPI({ file: specFileLocation });

function customHandler(context) {
    const authHeader = context.request.headers.authorization;
    if (!authHeader) {
        throw new Error('Missing authorization header');
    }
    const token = authHeader.replace('Bearer ', '');

    if (token === 'secret') {
        return 42;
    }

    return false;
}

const securityHandlers = [
    {
        name: 'customSecurityHandler',
        handler: customHandler,
    },
];
const api = new Api({
    version: 'v1',
    specification: openAPISpecification,
    controllers,
    securityHandlers,
});
const { app } = await setupServer({
    env: envExample,
    apis: [api],
    origin: 'trojs.org',
    staticFolder: './__fixtures__/',
});

const request = supertest(app);

test('Test the server', async (t) => {
    await t.test(
        'It should return status 200 for the specification (/v1/api-docs)',
        async () => {
            const response = await request.get('/v1/api-docs');

            assert.strictEqual(response.status, 200);
        }
    );

    await t.test(
        'It should return status 404 for a unknown page (/v1/xyz)',
        async () => {
            const response = await request.get('/v1/xyz');

            assert.strictEqual(response.status, 404);
            assert.deepEqual(
                {
                    message: response.body.message,
                    status: response.body.status,
                },
                {
                    message: 'Not found',
                    status: 404,
                }
            );
        }
    );

    await t.test(
        'It should response with a 200 message if you forgot the secret in the header',
        async () => {
            const response = await request.get('/v1/messages');

            assert.strictEqual(response.status, 200);
        }
    );

    await t.test(
        'It should response with a 400 message if the params are incorrect',
        async () => {
            const response = await request.get('/v1/messages?page=a');

            assert.strictEqual(response.status, 400);
            assert.deepEqual(
                {
                    message: response.body.message,
                    status: response.body.status,
                    errors: response.body.errors,
                },
                {
                    message: 'Bad Request',
                    status: 400,
                    errors: [
                        {
                            instancePath: '/query/page',
                            schemaPath:
                                '#/properties/query/properties/page/type',
                            keyword: 'type',
                            params: {
                                type: 'integer',
                            },
                            message: 'must be integer',
                        },
                    ],
                }
            );
        }
    );

    await t.test('It should return items', async () => {
        const response = await request.get('/v1/messages?page=0&size=10');

        assert.strictEqual(response.status, 200);
        assert.deepEqual(response.body, exampleResponse);
    });

    await t.test(
        "It should return the mocked user, because we don't have a controller yet",
        async () => {
            const response = await request.get('/v1/user');

            assert.strictEqual(response.status, 200);
            assert.deepEqual(response.body, {
                name: 'Pieter',
            });
        }
    );

    await t.test("It should catch error's", async () => {
        const response = await request.get('/v1/users');

        assert.strictEqual(response.status, 422);
        assert.deepEqual(response.body.status, 422);
        assert.deepEqual(response.body.message, 'test');
    });

    await t.test(
        'It should return 200 with the right secret for the custom security handler',
        async () => {
            const response = await request
                .get('/v1/user-secure')
                .set('authorization', 'secret');

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body, 42);
        }
    );

    await t.test(
        'It should return 401 with the wrong secret for the custom security handler',
        async () => {
            const response = await request
                .get('/v1/user-secure')
                .set('authorization', 'not-the-secret');

            assert.strictEqual(response.status, 401);
        }
    );
});
