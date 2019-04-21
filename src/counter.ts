// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { forOwn, isArray, findLast, isFunction } from 'lodash'
import check from 'check-types'
import { Transform } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import * as logger from 'winston'

export interface CounterOptions {
  counter: (data: any, count: (...args: any[]) => void) => void
  logger: (message: string, ...args: any[]) => void
  prefixComponents: string[]
  suffixComponents: string[]
  thresholds: number[]
  abortOnError: boolean
}

/**
 * Counts objects
 */
export class Counter extends Transform {
  static readonly DEFAULT_OPTIONS: CounterOptions = {
    counter: (data, count) => {
      count()
    },
    logger: (message, ...args) => {
      logger.log('info', message, ...args)
    },
    prefixComponents: ['Processed'],
    suffixComponents: ['item(s)'],
    thresholds: [10, 50, 250],
    abortOnError: false,
  }
  private _options: any
  private _defaultCount: (...args: any[]) => void
  private readonly _counters: {}
  /**
   * @constructor
   * @param options Processed counter options
   */
  constructor(options?: {} | CounterOptions) {
    options = Object.assign({}, Counter.DEFAULT_OPTIONS, options)
    check.assert.like(options, Counter.DEFAULT_OPTIONS)

    super({
      objectMode: true,
    })

    this._options = options

    this._counters = {}
    this._defaultCount = (...args) => this._count(...args)
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(
    chunk: Buffer | string | any,
    encoding: string,
    callback: Function,
  ) {
    BluebirdPromise.try(() => this._options.counter(chunk, this._defaultCount))
      .then(() => {
        this._print()
        callback(null, chunk)
      })
      .catch(error => {
        logger.log('error', 'Error in Counter:', error)
        callback(this._options.abortOnError ? error : null, chunk)
      })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_flush_callback
   * @override
   */
  _flush(callback: Function) {
    this._print(false)
    callback()
  }

  /**
   * Prints current counter to log
   */
  _print(checkThresholds = true) {
    forOwn(this._counters, (value, counter) => {
      const thresholds = isArray(this._options.thresholds)
        ? this._options.thresholds
        : this._options.thresholds[counter]

      const threshold = findLast(
        thresholds || [1],
        threshold => value >= threshold,
      )

      if (checkThresholds && value % threshold !== 0) {
        return
      }

      const prefixComponents = isArray(this._options.prefixComponents)
        ? this._options.prefixComponents
        : this._options.prefixComponents[counter]

      const suffixComponents = isArray(this._options.suffixComponents)
        ? this._options.suffixComponents
        : this._options.suffixComponents[counter]

      const logger = isFunction(this._options.logger)
        ? this._options.logger
        : this._options.logger[counter]

      logger(...(prefixComponents || []), value, ...(suffixComponents || []))
    })
  }

  /**
   * Counts a counter
   */
  _count(counter = '') {
    check.assert.string(counter)
    this._counters[counter] = (this._counters[counter] || 0) + 1
  }
}
