const _ = require('lodash')
const { Readable } = require('stream')

/**
 * Wraps multiple readable streams into a sequence
 */
class ReadableSequence extends Readable {
  /**
   * @constructor
   * @param {ReadableSequence~Factory|Readable[]} sequence Functor-factory or array of Readable streams
   * @param {boolean} [objectMode=false] Object mode setting
   */
  constructor (sequence, objectMode = false) {
    super({
      objectMode
    })

    this._context = null
    this._stream = null
    this._nextStreamGetter = null
    if (_.isFunction(sequence)) {
      this._nextStreamGetter = sequence
    } else if (_.isArray(sequence)) {
      this._nextStreamGetter = (oldStream, oldContext) => {
        const index = (_.isNil(oldContext) ? -1 : oldContext) + 1
        if (index >= sequence.length) {
          return null
        }
        return [sequence[index], index]
      }
    } else {
      throw new TypeError(`${typeof sequence} is not a supported sequence type`)
    }

    this._onStreamEndHandler = (...args) => this._onStreamEnd(...args)
    this._onStreamErrorHandler = (...args) => this._onStreamError(...args)
    this._onStreamDataHandler = (...args) => this._onStreamData(...args)
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  _read (size) {
    // Get next stream if there's no stream
    if (!this._stream) {
      this._obtainNextStream()
    }
  }

  /**
   * Obtains next stream
   *
   * @return {boolean} True if obtained new stream
   */
  _obtainNextStream () {
    // Obtain new stream
    const result = this._nextStreamGetter(this._stream, this._context)
    if (!result) {
      return false
    }

    // Detach from old stream
    if (this._stream) {
      this._stream.removeListener('end', this._onStreamEndHandler)
      this._stream.removeListener('error', this._onStreamErrorHandler)
      this._stream.removeListener('data', this._onStreamDataHandler)
    }

    // Attach to new stream
    if (_.isArray(result)) {
      [this._stream, this._context] = result
    } else {
      this._stream = result
      this._context = null
    }
    this._stream.addListener('end', this._onStreamEndHandler)
    this._stream.addListener('error', this._onStreamErrorHandler)
    this._stream.addListener('data', this._onStreamDataHandler)

    return true
  }

  /**
   * Handles stream end event
   */
  _onStreamEnd () {
    if (!this._obtainNextStream()) {
      setImmediate(() => this.push(null))
    }
  }

  /**
   * Handles stream error event
   */
  _onStreamError (error) {
    console.log('error')
    this.emit('error', error)
  }

  /**
   * Handles stream readable event
   */
  _onStreamData (chunk) {
    this.push(chunk)
  }
}

/**
 * Returns Readable stream
 *
 * @callback ReadableSequence~Factory
 * @param {Readable} oldStream Old stream
 * @param {} oldContext Old context data
 * @returns {Readable} Readable stream or null
 */

module.exports = ReadableSequence
