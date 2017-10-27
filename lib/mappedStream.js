const _ = require('lodash')
const { Transform } = require('stream')
const Promise = require('bluebird')

/**
 * Maps input to output using mapper
 */
class MappedStream extends Transform {
  /**
   * @constructor
   *
   * @param {MappedStream~Mapper} mapper Asynchronous mapper functor
   * @param {boolean} [inputObjectMode=true] True if input data is object stream, false if raw data chunks
   * @param {boolean} [outputObjectMode=true] True if output data is object stream, false if raw data chunks
   */
  constructor (mapper, inputObjectMode = true, outputObjectMode = true) {
    super({
      objectMode: false,
      readableObjectMode: outputObjectMode,
      writableObjectMode: inputObjectMode
    })

    if (!_.isFunction(mapper)) {
      throw new TypeError('Mapper must be a function')
    }

    this._mapper = mapper
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    Promise
      .resolve(this._mapper(this, chunk))
      .then(() => {
        callback(null, null)
      })
      .catch((error) => {
        callback(error, null)
      })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_flush_callback
   * @override
   */
  _flush (callback) {
    Promise
      .resolve(this._mapper(this, null))
      .then(() => {
        callback(null, null)
      })
      .catch((error) => {
        callback(error, null)
      })
  }
}

/**
 * Mapper functor
 *
 * @callback MappedStream~Mapper
 * @param {MappedStream} stream Stream
 * @param {} data Data or null if there's no more input data
 */

module.exports = MappedStream
