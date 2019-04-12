// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { Transform } from 'stream'
import { Promise } from 'bluebird'
import * as logger from 'winston'
import { MapperOptions } from './mapperOptions'

/**
 * Maps input stream to derivative readable stream
 */
export default class Mapper extends Transform {
  /**
   * @param inputObjectMode True if input data is object stream, false if raw data chunks
   * @param outputObjectMode True if output data is object stream, false if raw data chunks
   * @param abortOnError True if error in derivative stream should emit error, false otherwise
   */
  static DEFAULT_OPTIONS: MapperOptions = {
    inputObjectMode: false,
    outputObjectMode: false,
    abortOnError: false,
  }
  private _factory: any
  private _options: MapperOptions
  private _stream: Transform | null
  private _notifyTransformComplete: Function | null
  private readonly _onStreamEndHandler: () => void
  private readonly _onStreamErrorHandler: (error: Error) => void
  private readonly _onStreamDataHandler: (chunk: any) => void

  /**
   * @constructor
   *
   * @param factory Derivative stream factory
   * @param options Mapping options
   */
  constructor(factory: Function, options?: MapperOptions) {
    options = Object.assign({}, Mapper.DEFAULT_OPTIONS, options)

    super({
      objectMode: false,
      readableObjectMode: options.outputObjectMode,
      writableObjectMode: options.inputObjectMode,
    })

    this._factory = factory
    this._options = Object.assign({}, Mapper.DEFAULT_OPTIONS, options)

    this._stream = null
    this._notifyTransformComplete = null

    this._onStreamEndHandler = () => this._onStreamEnd()
    this._onStreamErrorHandler = error => this._onStreamError(error)
    this._onStreamDataHandler = chunk => this._onStreamData(chunk)
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
    Promise.try(() => this._factory(chunk))
      .catch(error => {
        logger.log('error', 'Error in Mapper while creating stream:', error)
        if (this._options.abortOnError) {
          throw error
        }
      })
      .then(stream => {
        this._stream = stream
        this._notifyTransformComplete = callback
        if (!this._stream) {
          callback()
          return
        }
        this._stream
          .on('end', this._onStreamEndHandler)
          .on('error', this._onStreamErrorHandler)
          .on('data', this._onStreamDataHandler)
      })
      .catch(error => {
        logger.log('error', 'Error in Mapper:', error)
        callback(error)
      })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_writable_destroy_err_callback
   * @override
   */
  _destroy(error: Error, callback: any) {
    if (this._stream) {
      this._detachFromStream()
      this._stream.destroy()
      this._stream = null
    }

    super._destroy(error, callback)
  }

  /**
   * Detaches from current stream
   */
  _detachFromStream() {
    if (this._stream) {
      this._stream.removeListener('end', this._onStreamEndHandler)
      this._stream.removeListener('error', this._onStreamErrorHandler)
      this._stream.removeListener('data', this._onStreamDataHandler)
    }
  }

  /**
   * Handles stream end event
   */
  _onStreamEnd() {
    this._detachFromStream()
    if (this._notifyTransformComplete) {
      this._notifyTransformComplete()
    }
  }

  /**
   * Handles stream error event
   */
  _onStreamError(error: Error) {
    logger.log('error', 'Error in Mapper derivative stream:', error)

    this._detachFromStream()
    if (this._notifyTransformComplete) {
      this._notifyTransformComplete(this._options.abortOnError ? error : null)
    }
  }

  /**
   * Handles stream readable event
   */
  _onStreamData(chunk: any) {
    this.push(chunk)
  }
}
