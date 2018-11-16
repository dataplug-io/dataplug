import { last, first, forEach, flatten, isFunction } from 'lodash'
import check from 'check-types'
import { Promise as BluebirdPromise } from 'bluebird'
import * as logger from 'winston'
import { Transform } from 'stream'

/**
 * Replicates data using specified chain
 *
 * @param chain Array that starts from Readable, and ends with Writable with Transform(s) in-between
 */
export default async function replicate(
  chain: Array<
    NodeJS.ReadableStream | NodeJS.WritableStream | Transform | Promise<any>
  >,
) {
  check.assert.nonEmptyArray(chain)
  check.assert.greaterOrEqual(chain.length, 2)

  let resolvedChain: any
  return BluebirdPromise.all(chain)
    .then(
      chain =>
        new Promise((resolve, reject) => {
          resolvedChain = chain = flatten(chain)

          forEach(chain, (item, index) => {
            item.on('error', (error: Error) => {
              reject(error)
            })

            if (index > 0) {
              chain[index - 1].pipe(item)
            }
          })

          if (chain) {
            last(chain).on('finish', () => {
              resolve()
            })
            first(chain).resume()
          }
        }),
    )
    .catch(error => {
      logger.log('error', 'Error while replicating:', error)

      forEach(resolvedChain, item => {
        if (isFunction(item.unpipe)) {
          item.unpipe()
        }
        item.destroy()
      })

      throw error
    })
}
