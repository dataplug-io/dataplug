import { JSONSchema6 } from 'json-schema'
import Source from './source'
import Target from './target'

export default interface Collection {
  origin: string
  name: string
  schema: JSONSchema6
  source: Source
  target: Target
}
