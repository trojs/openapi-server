/* @ts-self-types="../types/types.d.ts" */
/**
 * A portable URL constructor shape that avoids DOM-specific MediaSource in d.ts.
 * @typedef {{
 * new (url: string | URL, base?: string | URL): URL
 * prototype: URL
 * canParse(url: string | URL, base?: string | URL): boolean
 * createObjectURL(obj: Blob | unknown): string
 * parse(url: string | URL, base?: string | URL): URL | null
 * revokeObjectURL(url: string): void
 * }} URLStatic
 */

const types = {
  string: String,
  array: Array,
  object: Object,
  number: Number,
  integer: Number,
  boolean: Boolean,
  url: /** @type {URLStatic} */ (URL),
  date: Date
}

export { types }
