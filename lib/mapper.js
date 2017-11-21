const check = require('check-types')
const { Transform } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')

/**
 * Maps input stream to derivative readable stream
 */
class Mapper extends Transform {
  /**
   * @constructor
   *
   * @param {Mapper~Factory} factory Derivative stream factory
   * @param {Mapper~Options} [options=] Mapping options
   */
  constructor (factory, options = undefined) {
    check.assert.function(factory)
    options = Object.assign({}, Mapper.DEFAULT_OPTIONS, options)
    check.assert.like(options, Mapper.DEFAULT_OPTIONS)

    super({
      objectMode: false,
      readableObjectMode: options.outputObjectMode,
      writableObjectMode: options.inputObjectMode
    })

    this._factory = factory
    this._options = Object.assign({}, Mapper.DEFAULT_OPTIONS, options)

    this._stream = null
    this._notifyTransformComplete = null

    this._onStreamEndHandler = (...args) => this._onStreamEnd(...args)
    this._onStreamErrorHandler = (...args) => this._onStreamError(...args)
    this._onStreamDataHandler = (...args) => this._onStreamData(...args)
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    Promise.try(() => this._factory(chunk))
      .catch((error) => {
        logger.log('error', 'Error in Mapper while creating stream:', error)
        if (this._options.abortOnError) {
          throw error
        }
      })
      .then((stream) => {
        if (!stream) {
          callback()
          return
        }
        this._stream = stream
        this._notifyTransformComplete = callback
        this._stream
          .on('end', this._onStreamEndHandler)
          .on('error', this._onStreamErrorHandler)
          .on('data', this._onStreamDataHandler)
      })
      .catch((error) => {
        logger.log('error', 'Error in Mapper:', error)
        callback(error)
      })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_writable_destroy_err_callback
   * @override
   */
  _destroy (error, callback) {
    if (this._stream) {
      this._detachFromStream()
      this._stream.destroy()
      this._stream = null
    }

    super._destroy(error, callback)
  }

  /**
   * Detaches from current stream
   */
  _detachFromStream () {
    this._stream.removeListener('end', this._onStreamEndHandler)
    this._stream.removeListener('error', this._onStreamErrorHandler)
    this._stream.removeListener('data', this._onStreamDataHandler)
  }

  /**
   * Handles stream end event
   */
  _onStreamEnd () {
    this._detachFromStream()
    this._notifyTransformComplete()
  }

  /**
   * Handles stream error event
   */
  _onStreamError (error) {
    logger.log('error', 'Error in Mapper derivative stream:', error)

    this._detachFromStream()
    this._notifyTransformComplete(this._options.abortOnError ? error : null)
  }

  /**
   * Handles stream readable event
   */
  _onStreamData (chunk) {
    this.push(chunk)
  }
}

/**
 * Mapped stream factory
 *
 * @callback Mapper~Factory
 * @param {} data Data to map into derivative stream
 * @returns {Readable} Mapped stream instance to read from, falsy value skips to next
 */

/**
 * @typedef {Object} Mapper~Options
 * @param {boolean} [inputObjectMode] True if input data is object stream, false if raw data chunks
 * @param {boolean} [outputObjectMode] True if output data is object stream, false if raw data chunks
 * @param {boolean} [abortOnError] True if error in derivative stream should emit error, false otherwise
 */
Mapper.DEFAULT_OPTIONS = {
  inputObjectMode: true,
  outputObjectMode: true,
  abortOnError: false
}

module.exports = Mapper
