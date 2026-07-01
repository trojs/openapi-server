import { spawnSync } from 'node:child_process'

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10)
const baseArgs = [
  '--test',
  '--experimental-test-coverage',
  '--test-reporter=spec'
]

// The built-in lcov reporter is used on supported Node versions.
const reporterArgs = nodeMajor >= 24
  ? [
      '--test-reporter=lcov',
      '--test-reporter-destination=stdout',
      '--test-reporter-destination=./coverage/lcov.info'
    ]
  : ['--test-reporter-destination=stdout']

const args = [
  ...baseArgs,
  ...reporterArgs,
  ...process.argv.slice(2)
]

const result = spawnSync(process.execPath, args, { stdio: 'inherit' })

if (result.error) {
  throw result.error
}

if (result.status !== 0) {
  throw new Error(`Tests failed with exit code ${result.status ?? 1}`)
}
