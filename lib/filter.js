const check = require('check-types')
const { Transform } = require('stream')

/**
 * Filters the object stream
 *
 * @property {Filter~Callback} filterCallback
 */
class Filter extends Transform {
  /**
   * @constructor
   * @param {Filter~Callback} filterCallback
   */
  constructor (filterCallback) {
    check.assert.function(filterCallback)

    super({
      objectMode: true
    })

    this._filterCallback = filterCallback
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    new Promise(async (resolve) => {
      let accepted = false
      try {
        accepted = await this._filterCallback(chunk)
      } catch (error) {
      }
      resolve(accepted)
    })
      .then((accepted) => {
        callback(null, accepted ? chunk : null)
      })
      .catch((error) => {
        callback(error, null)
      })
  }
}

/**
 * Filter callback functor
 *
 * @callback Filter~Callback
 * @param {} chunk Chunk
 * @return {boolean} Truthy to accept the chunk
 */

module.exports = Filter
