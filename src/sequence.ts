// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { isFunction, isArray, isNil } from 'lodash'
import { Readable } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import * as logger from 'winston'

export interface SequenceOptions {
  objectMode?: boolean
  abortOnError?: boolean
}

export type SequenceFactory = (
  oldStream: NodeJS.ReadableStream | null,
  oldContext: any | null,
) =>
  | NodeJS.ReadableStream
  | Array<NodeJS.ReadableStream | any>
  | null
  | PromiseLike<
      NodeJS.ReadableStream | Array<NodeJS.ReadableStream | any> | null
    >

/**
 * Wraps multiple readable streams into a sequence
 */
export class Sequence extends Readable {
  /**
   * @param objectMode Object mode setting
   * @param abortOnError True if error in sequence should emit error, false otherwise
   */
  static DEFAULT_OPTIONS: SequenceOptions = {
    objectMode: true,
    abortOnError: false,
  }

  private _options: SequenceOptions
  private _context: any | null
  private _stream: NodeJS.ReadableStream | null
  private readonly _nextStreamGetter: SequenceFactory | null
  private readonly _onStreamEndHandler: () => void
  private readonly _onStreamCloseHandler: () => void
  private readonly _onStreamDataHandler: (chunk: any) => void
  private readonly _onStreamErrorHandler: (error: Error) => void

  /**
   * @constructor
   * @param sequence Functor-factory or array of Readable streams
   * @param options Sequence options
   */
  constructor(
    sequence: SequenceFactory | Array<NodeJS.ReadableStream>,
    options?: SequenceOptions,
  ) {
    options = Object.assign({}, Sequence.DEFAULT_OPTIONS, options)

    super({
      objectMode: options.objectMode,
    })

    this._options = options

    this._context = null
    this._stream = null
    if (isFunction(sequence)) {
      this._nextStreamGetter = sequence
    } else if (isArray(sequence)) {
      this._nextStreamGetter = (oldStream, oldContext) => {
        const index = (isNil(oldContext) ? -1 : (oldContext as number)) + 1
        if (index >= sequence.length) {
          return null
        }
        return [sequence[index], index]
      }
    } else {
      this._nextStreamGetter = null
    }

    this._onStreamEndHandler = () => this._onStreamEnd()
    this._onStreamCloseHandler = () => this._onStreamClose()
    this._onStreamErrorHandler = error => this._onStreamError(error)
    this._onStreamDataHandler = (chunk: any) => this._onStreamData(chunk)

    this.once('read', () => {
      this._obtainNextStream()
    })
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  _read(size: number) {
    this.emit('read')
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_destroy_err_callback
   */
  _destroy(error: Error | null, callback: (error?: Error | null) => void) {
    if (this._stream) {
      this._detachFromStream()
      if (isFunction(this._stream['destroy'])) {
        this._stream['destroy'](error || undefined)
      }
      this._stream = null
    }

    super._destroy(error, callback)
  }

  /**
   * Obtains next stream
   */
  _obtainNextStream() {
    if (this._nextStreamGetter) {
      BluebirdPromise.try(() =>
        this._nextStreamGetter!(this._stream, this._context),
      )
        .catch(error => {
          logger.log(
            'error',
            'Error in Sequence while getting next stream:',
            error,
          )
          if (this._options.abortOnError) {
            throw error
          }
        })
        .then(result => {
          if (!result) {
            this.push(null)
            return
          }

          if (isArray(result)) {
            this._stream = result[0] as NodeJS.ReadableStream
            this._context = result[1] as object
          } else {
            this._stream = result
            this._context = null
          }
          if (this._stream) {
            this._stream
              .on('end', this._onStreamEndHandler)
              .on('close', this._onStreamCloseHandler)
              .on('error', this._onStreamErrorHandler)
              .on('data', this._onStreamDataHandler)
          }
        })
        .catch(error => {
          logger.log('error', 'Error in Sequence:', error)
          this.emit('error', error)
          this.push(null)
        })
    }
  }

  /**
   * Detaches from current stream
   */
  _detachFromStream() {
    if (this._stream) {
      this._stream.removeListener('end', this._onStreamEndHandler)
      this._stream.removeListener('close', this._onStreamCloseHandler)
      this._stream.removeListener('error', this._onStreamErrorHandler)
      this._stream.removeListener('data', this._onStreamDataHandler)
    }
  }

  /**
   * Handles stream end event
   */
  _onStreamEnd() {
    this._detachFromStream()
    this._obtainNextStream()
  }

  /**
   * Handles stream close event
   */
  _onStreamClose() {
    this._detachFromStream()
    this._obtainNextStream()
  }

  /**
   * Handles stream error event
   */
  _onStreamError(error: Error) {
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
  _onStreamData(chunk: any) {
    this.push(chunk)
  }
}
