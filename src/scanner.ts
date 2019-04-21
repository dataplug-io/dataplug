// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { Transform, TransformCallback } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import * as logger from 'winston'

export type ScannerCallback = (chunk: any) => void | PromiseLike<void>

/**
 * Scans the object stream
 */
export class Scanner extends Transform {
  private _scannerCallback: ScannerCallback
  private readonly _abortOnError: boolean

  /**
   * @constructor
   * @param scannerCallback
   * @param abortOnError True if error in filtering should emit error, false otherwise
   */
  constructor(scannerCallback: ScannerCallback, abortOnError: boolean = false) {
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
  _transform(chunk: any, encoding: string, callback: TransformCallback) {
    BluebirdPromise.try(() => this._scannerCallback(chunk))
      .catch(error => {
        logger.log('error', 'Error in Scanner', error)
        return error
      })
      .then(error => {
        callback(this._abortOnError ? error : null, chunk)
      })
  }
}
