const { Transform } = require('stream')
const DataFlatter = require('./dataFlatter')

/**
 * Flattens the object stream
 */
class StreamFlatter extends Transform {
  /**
   * @constructor
   *
   * @param {Object} jsonSchema JSON schema
   * @param {string} [pathSeparator=undefined] Path separator
   * @param {string} [generatedFieldPrefix=undefined] Generated field prefix
   * @param {string} [placeholder=undefined] Placeholder
   */
  constructor (jsonSchema, pathSeparator = undefined, generatedFieldPrefix = undefined, placeholder = undefined) {
    super({
      objectMode: true
    })

    this._dataFlatter = new DataFlatter(jsonSchema, pathSeparator, generatedFieldPrefix, placeholder)
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    try {
      const flattened = this._dataFlatter.flatten(chunk)
      callback(null, flattened)
    } catch (error) {
      console.error('Failed to flatten data', error)
      callback(error, null)
    }
  }
}

module.exports = StreamFlatter
