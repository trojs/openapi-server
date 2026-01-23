import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const files = [
  { path: 'types/openapi.js', content: '/* @ts-self-types=\'./openapi.d.ts\' */\nexport * from \'../src/openapi.js\'\n' },
  { path: 'types/api.js', content: '/* @ts-self-types=\'./api.d.ts\' */\nexport * from \'../src/api.js\'\n' }
]

await Promise.all(
  files.map(async (f) => {
    await mkdir(dirname(f.path), { recursive: true })
    await writeFile(f.path, f.content)
  })
)
