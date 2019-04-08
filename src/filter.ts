import { isError } from 'lodash'
import { Transform } from 'stream'
import { Promise } from 'bluebird'
import * as logger from 'winston'

/**
 * Filters the object stream
 */
export default class Filter extends Transform {
  private _filterCallback: Function
  private readonly _abortOnError: boolean
  /**
   * @constructor
   *
   * @param filterCallback
   * @param abortOnError True if error in filtering should emit error, false otherwise
   */
  constructor(filterCallback: Function, abortOnError: boolean = false) {
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
  _transform(
    chunk: Buffer | string | any,
    encoding: string,
    callback: Function,
  ) {
    Promise.try(() => this._filterCallback(chunk))
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
