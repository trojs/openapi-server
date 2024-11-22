import test from 'node:test'
import assert from 'node:assert'
import getStatusByError from './error-status.js'

const TestCases = [
    {
        description: 'A normal error should return status 500',
        error: new Error('test'),
        expectedResult: 500
    },
    {
        description: 'A type error should return status 422',
        error: new TypeError('test'),
        expectedResult: 422
    },
    {
        description: 'A range error should return status 404',
        error: new RangeError('test'),
        expectedResult: 404
    }
]

test('Error status entity', async (t) => {
    await Promise.all(
        TestCases.map(async ({ description, error, expectedResult }) => {
            await t.test(description, () => {
                assert.deepEqual(getStatusByError(error), expectedResult)
            })
        })
    )
})
