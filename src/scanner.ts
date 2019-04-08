// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { Transform } from 'stream'
import Promise from 'bluebird'
import * as logger from 'winston'

/**
 * Scans the object stream
 */
export default class Scanner extends Transform {
  private _scannerCallback: any
  private readonly _abortOnError: boolean
  /**
   * @constructor
   * @param scannerCallback
   * @param abortOnError True if error in filtering should emit error, false otherwise
   */
  constructor(scannerCallback: Function, abortOnError: boolean = false) {
    super({
      objectMode: true,
    })

    this._scannerCallback = scannerCallback
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
    Promise.try(() => this._scannerCallback(chunk))
      .catch(error => {
        logger.log('error', 'Error in Scanner', error)
        return error
      })
      .then(error => {
        callback(this._abortOnError ? error : null, chunk)
      })
  }
}
