const check = require('check-types')
const { Transform } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')

/**
 * Scans the object stream
 */
class Scanner extends Transform {
  /**
   * @constructor
   * @param {Scanner~Callback} scannerCallback
   * @param {boolean} [abortOnError=] True if error in filtering should emit error, false otherwise
   */
  constructor (scannerCallback, abortOnError = false) {
    check.assert.function(scannerCallback)
    check.assert.boolean(abortOnError)

    super({
      objectMode: true
    })

    this._scannerCallback = scannerCallback
    this._abortOnError = abortOnError
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    Promise.try(() => this._scannerCallback(chunk))
      .catch((error) => {
        logger.log('error', 'Error in Scanner', error)
        return error
      })
      .then((error) => {
        callback(this._abortOnError ? error : null, chunk)
      })
  }
}

module.exports = Scanner
