const check = require('check-types')
const { Transform } = require('stream')
const logger = require('winston')

/**
 * Filters the object stream
 *
 * @property {Filter~Callback} filterCallback
 */
class Filter extends Transform {
  /**
   * @constructor
   *
   * @param {Filter~Callback} filterCallback
   * @param {boolean} [abortOnError=] True if error in filtering should emit error, false otherwise
   */
  constructor (filterCallback, abortOnError = false) {
    check.assert.function(filterCallback)
    check.assert.boolean(abortOnError)

    super({
      objectMode: true
    })

    this._filterCallback = filterCallback
    this._abortOnError = abortOnError
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    new Promise(async (resolve, reject) => {
      let accepted = false
      try {
        accepted = await this._filterCallback(chunk)
      } catch (error) {
        reject(error)
      }
      resolve(accepted)
    })
      .then((accepted) => {
        callback(null, accepted ? chunk : null)
      })
      .catch((error) => {
        logger.log('error', 'Error in Filter', error)
        callback(this._abortOnError ? error : null, null)
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
