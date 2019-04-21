// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { last, first, forEach, flatten, isFunction } from 'lodash'
import { Promise as BluebirdPromise } from 'bluebird'
import * as logger from 'winston'
import { Stream, isWritableStream, isReadableStream } from './stream'

export interface ReplicationChain<T = Stream>
  extends Array<
    T | PromiseLike<T> | ReplicationChain<T> | PromiseLike<ReplicationChain<T>>
  > {}

export type ReplicationChainElement<T = Stream> =
  | T
  | PromiseLike<T>
  | ReplicationChain<T>
  | PromiseLike<ReplicationChain<T>>

/**
 * Checks if replication chain is deemed complete
 *
 * @param chain Array of streams to be checked
 * @param strict Treat promises as valid elements of the chain
 */
export function isReplicationChainComplete(
  chain: ReplicationChain,
  strict: boolean = true,
): boolean {
  let result = true

  result = result && chain.length >= 2

  const firstStream = first(chain)
  result = result && !!firstStream
  result =
    result &&
    (isReadableStream(firstStream!) ||
      (!strict && isFunction(firstStream!['then'])))

  const lastStream = last(chain)
  result = result && !!lastStream
  result =
    result &&
    (isWritableStream(lastStream!) ||
      (!strict && isFunction(lastStream!['then'])))

  return result
}

/**
 * Replicates data using specified chain
 *
 * @param chain Array starting with ReadableStream, following by 0 or more
 *              ReadableStream & WritableStream, ending with WritableStream
 */
export async function replicate(chain: ReplicationChain): Promise<{}> {
  if (!isReplicationChainComplete(chain)) {
    return BluebirdPromise.all<ReplicationChainElement>(flatten(chain)).then(
      chain => replicate(chain),
    )
  }

  return new BluebirdPromise((resolve, reject) => {
    if (chain.length < 2) {
      reject(
        new Error('Replication chain can not have less than 2 streams in it'),
      )
      return
    }

    forEach(chain as Array<Stream>, (stream, index) => {
      if (index > 0 && !isWritableStream(stream)) {
        reject(
          new Error(
            `Stream at position #${index} of the replication chain ` +
              'is not WritableStream',
          ),
        )
        return
      }
      if (index < chain.length - 1 && !isReadableStream(stream)) {
        reject(
          new Error(
            `Stream at position #${index} of the chain is not ` +
              'ReadableStream',
          ),
        )
        return
      }

      stream.on('error', (error: Error) => {
        reject(error)
        return
      })

      if (index > 0) {
        const previousStream = chain[index - 1] as NodeJS.ReadableStream
        previousStream.pipe(stream as NodeJS.WriteStream)
      }
    })

    if (chain) {
      const lastStream = last(chain)! as NodeJS.WritableStream
      const firstStream = first(chain)! as NodeJS.ReadableStream

      lastStream.on('finish', () => {
        resolve()
      })
      firstStream.resume()
    }
  }).catch(error => {
    logger.log('error', 'Error while replicating', error)

    forEach(chain as Array<Stream>, (stream, index) => {
      if (index < chain.length - 1) {
        const readableStream = stream as NodeJS.ReadableStream
        if (!isFunction(readableStream['unpipe'])) {
          console.log('YODA', readableStream)
        }
        readableStream.unpipe()
      }

      if (index > 0) {
        const writableStream = stream as NodeJS.WritableStream
        writableStream.end()
      }
    })

    throw error
  })
}
