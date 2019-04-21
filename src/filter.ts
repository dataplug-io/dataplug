// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { isError } from 'lodash'
import { Transform, TransformCallback } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import * as logger from 'winston'

export type FilterCallback = (chunk: any) => any | PromiseLike<any>

/**
 * Filters the object stream
 */
export class Filter extends Transform {
  private _filterCallback: FilterCallback
  private readonly _abortOnError: boolean

  /**
   * @constructor
   *
   * @param filterCallback
   * @param abortOnError True if error in filtering should emit error, false otherwise
   */
  constructor(filterCallback: FilterCallback, abortOnError: boolean = false) {
    super({
      objectMode: true,
    })

    this._filterCallback = filterCallback
    this._abortOnError = abortOnError
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(chunk: any, encoding: string, callback: TransformCallback) {
    BluebirdPromise.try(() => this._filterCallback(chunk))
      .catch(error => {
        logger.log('error', 'Error in Filter', error)
        return error
      })
      .then(result => {
        const error = isError(result) && this._abortOnError ? result : null
        const data = isError(result) || !result ? null : chunk
        callback(error, data)
      })
  }
}
