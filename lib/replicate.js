const _ = require('lodash')
const check = require('check-types')
const Promise = require('bluebird')
const logger = require('winston')

/**
 * Replicates data using specified chain
 *
 * @param {[]} chain Array that starts from Readable, and ends with Writable with Transform(s) in-between
 */
async function replicate (chain) {
  check.assert.nonEmptyArray(chain)
  check.assert.greaterOrEqual(chain.length, 2)

  let resolvedChain
  return Promise.all(chain)
    .then((chain) => new Promise((resolve, reject) => {
      resolvedChain = chain = _.flatten(chain)

      _.forEach(chain, (item, index) => {
        item
          .on('error', (error) => {
            reject(error)
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
    .catch((error) => {
      logger.log('error', 'Error while replicating:', error)

      _.forEach(resolvedChain, (item) => {
        if (_.isFunction(item.unpipe)) {
          item.unpipe()
        }
        item.destroy()
      })

      throw error
    })
}

module.exports = replicate
