const _ = require('lodash')
const check = require('check-types')
const { Transform } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')

/**
 * Counts objects
 */
class Counter extends Transform {
  /**
   * @constructor
   * @param {Counter~Options} [options=] Processed counter options
   */
  constructor (options = undefined) {
    options = Object.assign({}, Counter.DEFAULT_OPTIONS, options)
    check.assert.like(options, Counter.DEFAULT_OPTIONS)

    super({
      objectMode: true
    })

    this._options = options

    this._counters = {}
    this._defaultCount = (...args) => this._count(...args)
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    Promise.try(() => this._options.counter(chunk, this._defaultCount))
      .then(() => {
        this._print()
        callback(null, chunk)
      })
      .catch((error) => {
        logger.log('error', 'Error in Counter:', error)
        callback(this._options.abortOnError ? error : null, chunk)
      })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_flush_callback
   * @override
   */
  _flush (callback) {
    this._print(false)
    callback()
  }

  /**
   * Prints current counter to log
   */
  _print (checkThresholds = true) {
    _.forOwn(this._counters, (value, counter) => {
      const thresholds = _.isArray(this._options.thresholds)
        ? this._options.thresholds
        : this._options.thresholds[counter]

      const threshold = _.findLast(thresholds || [1], (threshold) => value >= threshold)

      if (checkThresholds && value % threshold !== 0) {
        return
      }

      const prefixComponents = _.isArray(this._options.prefixComponents)
        ? this._options.prefixComponents
        : this._options.prefixComponents[counter]

      const suffixComponents = _.isArray(this._options.suffixComponents)
        ? this._options.suffixComponents
        : this._options.suffixComponents[counter]

      const logger = _.isFunction(this._options.logger)
        ? this._options.logger
        : this._options.logger[counter]

      logger(
        ...(prefixComponents || []),
        value,
        ...(suffixComponents || []))
    })
  }

  /**
   * Counts a counter
   */
  _count (counter = '') {
    check.assert.string(counter)
    this._counters[counter] = (this._counters[counter] || 0) + 1
  }
}

/**
 * @typedef {Object} Counter~Options
 * @param {function} [counter] Counter function
 * @param {function} [logger] Logger function or object of logger functions
 * @param {[]} [prefixComponents] Components to print before counter, array or object of arrays
 * @param {[]} [suffixComponents] Components to print after counter, array or object of arrays
 * @param {integer[]} [thresholds] Array of thresholds or object of array of thresholds
 * @param {boolean} [abortOnError] True if error in counting should emit error, false otherwise
 */
Counter.DEFAULT_OPTIONS = {
  counter: (data, count) => {
    count()
  },
  logger: (...args) => {
    logger.log('info', ...args)
  },
  prefixComponents: [
    'Processed'
  ],
  suffixComponents: [
    'item(s)'
  ],
  thresholds: [
    10, 50, 250
  ],
  abortOnError: false
}

module.exports = Counter
