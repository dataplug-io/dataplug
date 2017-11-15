const _ = require('lodash')
const check = require('check-types')
const Promise = require('bluebird')
const logger = require('winston')

/**
 * Replicates data using specified chain
 *
 * @param {[]} chain Array that starts from Readable, and ends with Writable with Transform(s) in-between
 * @param {boolean} [abortOnError=] True to abort on error, false otherwise
 */
async function replicate (chain, abortOnError = false) {
  check.assert.nonEmptyArray(chain)
  check.assert.greaterOrEqual(chain.length, 2)
  check.assert.boolean(abortOnError)

  return Promise.all(chain)
    .then((chain) => new Promise((resolve, reject) => {
      chain = _.flatten(chain)

      _.forEach(chain, (item, index) => {
        item
          .on('error', (error) => {
            logger.log('warn', 'Error while replicating:', error)
            if (abortOnError) {
              _.first(chain).destroy()
              reject(error)
            }
          })

        if (index > 0) {
          chain[index - 1]
            .pipe(item)
        }
      })

      _.last(chain)
        .on('finish', () => {
          resolve()
        })
      _.first(chain)
        .resume()
    }))
}

module.exports = replicate
