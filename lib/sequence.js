const _ = require('lodash')
const check = require('check-types')
const { Readable } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')

/**
 * Wraps multiple readable streams into a sequence
 */
class Sequence extends Readable {
  /**
   * @constructor
   * @param {Sequence~Factory|Readable[]} sequence Functor-factory or array of Readable streams
   * @param {Sequence~Options} [options=] Sequence options
   */
  constructor (sequence, options = undefined) {
    check.assert(check.any([
      check.function(sequence),
      check.array(sequence)
    ]))
    options = Object.assign({}, Sequence.DEFAULT_OPTIONS, options)
    check.assert.like(options, Sequence.DEFAULT_OPTIONS)

    super({
      objectMode: options.objectMode
    })

    this._options = options

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
    }

    this._onStreamEndHandler = (...args) => this._onStreamEnd(...args)
    this._onStreamErrorHandler = (...args) => this._onStreamError(...args)
    this._onStreamDataHandler = (...args) => this._onStreamData(...args)

    this.once('read', () => {
      this._obtainNextStream()
    })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  _read (size) {
    this.emit('read')
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_destroy_err_callback
   */
  _destroy (error, callback) {
    if (this._stream) {
      this._detachFromStream()
      this._stream.destroy(error)
      this._stream = null
    }

    super._destroy(error, callback)
  }

  /**
   * Obtains next stream
   */
  _obtainNextStream () {
    Promise.try(() => this._nextStreamGetter(this._stream, this._context))
      .catch((error) => {
        logger.log('error', 'Error in Sequence while getting next stream:', error)
        if (this._options.abortOnError) {
          throw error
        }
      })
      .then((result) => {
        if (!result) {
          this.push(null)
          return
        }

        if (_.isArray(result)) {
          [this._stream, this._context] = result
        } else {
          this._stream = result
          this._context = null
        }

        this._stream
          .on('end', this._onStreamEndHandler)
          .on('error', this._onStreamErrorHandler)
          .on('data', this._onStreamDataHandler)
      })
      .catch((error) => {
        logger.log('error', 'Error in Sequence:', error)
        this.emit('error', error)
        this.push(null)
      })
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
    this._obtainNextStream()
  }

  /**
   * Handles stream error event
   */
  _onStreamError (error) {
    logger.log('error', 'Error in Sequence chain:', error)

    this._detachFromStream()
    if (this._options.abortOnError) {
      this.emit('error', error)
      this.push(null)
    } else {
      this._obtainNextStream()
    }
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
 * @callback Sequence~Factory
 * @param {Readable} oldStream Old stream
 * @param {} oldContext Old context data
 * @returns {Readable} Readable stream or null
 */

/**
 * @typedef {Object} Sequence~Options
 * @param {boolean} [objectMode] Object mode setting
 * @param {boolean} [abortOnError] True if error in sequence should emit error, false otherwise
 */
Sequence.DEFAULT_OPTIONS = {
  objectMode: true,
  abortOnError: false
}

module.exports = Sequence
