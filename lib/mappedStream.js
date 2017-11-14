const check = require('check-types')
const { Transform } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')

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
    check.assert.function(mapper)
    check.assert.boolean(inputObjectMode)
    check.assert.boolean(outputObjectMode)

    super({
      objectMode: false,
      readableObjectMode: outputObjectMode,
      writableObjectMode: inputObjectMode
    })

    this._mapper = mapper
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    this._map(chunk, callback)
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_flush_callback
   * @override
   */
  _flush (callback) {
    this._map(null, callback)
  }

  /**
   * Maps chunk and provides result to callback
   *
   * @param {} chunk
   * @param {function} callback
   */
  _map (chunk, callback) {
    new Promise((resolve, reject) => {
      try {
        resolve(this._mapper(this, chunk))
      } catch (error) {
        reject(error)
      }
    })
      .then(() => {
        callback(null, null)
      })
      .catch((error) => {
        logger.log('error', 'Error in MappedStream:', error)
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
