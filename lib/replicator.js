const _ = require('lodash')
const check = require('check-types')
const Promise = require('bluebird')
const Source = require('./source')
const StreamFlatter = require('./streamFlatter')
const Target = require('./target')

/**
 * Replicates data from source to target(s)
 */
class Replicator {
  /**
   * @constructor
   * @param {Source} source Source to replicate
   * @param {} sourceParams Source parameters
   * @param {string} [collectionName=] Collection name
   * @param {object} [schema=] Collection schema
   */
  constructor (source, sourceParams, collectionName = undefined, schema = undefined) {
    check.assert.instance(source, Source)
    check.assert.object(sourceParams)
    check.assert.maybe.nonEmptyString(collectionName)
    check.assert.maybe.object(schema)

    this._source = source
    this._sourceParams = sourceParams
    this._collectionName = collectionName
    this._schema = schema

    this._targets = []
    this._processors = []
  }

  /**
   * Adds specified target to replication
   *
   * @param {Target} target Replication target
   * @param {} targetParams Target parameters
   * @returns This instance for chaining purposes
   */
  toTarget (target, targetParams) {
    check.assert.instance(target, Target)
    check.assert.object(targetParams)

    this._targets.push({
      target,
      targetParams,
      viaFlatter: false
    })

    return this
  }

  /**
   * Adds specified target to replication
   *
   * @param {Target} target Replication target
   * @param {} targetParams Target parameters
   * @returns This instance for chaining purposes
   */
  toTargetViaFlatter (target, targetParams) {
    check.assert.instance(target, Target)
    check.assert.object(targetParams)

    if (!this._collectionName || !this._schema) {
      throw new Error('Flatter requires collection name and schema to be specified')
    }

    this._targets.push({
      target,
      targetParams,
      viaFlatter: true
    })

    return this
  }

  /**
   * Adds processor to Replication
   *
   * @param {Replicator~Processor} processor Processor
   * @returns This instance for chaining purposes
   */
  withProcessor (processor) {
    check.assert.function(processor)

    this._processors.push(processor)

    return this
  }

  /**
   * Resets the Replicator
   *
   * @returns This instance for chaining purposes
   */
  reset () {
    this._targets = []
    this._processors = []

    return this
  }

  /**
   * Performs replication
   */
  async replicate () {
    const sourceOutput = await this._source.createOutput(this._sourceParams)
    const flattenStream = (this._schema && this._collectionName)
      ? new StreamFlatter(this._schema, this._collectionName, true)
      : undefined

    return Promise.map(this._targets, async (item) => {
      const targetInput = await item.target.createInput(item.targetParams)

      const sourceStreams = _.isArray(sourceOutput) ? sourceOutput : [sourceOutput]
      const targetStreams = _.isArray(targetInput) ? targetInput : [targetInput]

      return new Promise((resolve, reject) => {
        _.forEach(sourceStreams, (sourceStream) => {
          sourceStream
            .on('error', (error) => {
              reject(error)
            })
        })

        _.forEach(targetStreams, (targetStream) => {
          targetStream
            .on('error', (error) => {
              reject(error)
            })
        })

        let report = {
          processed: 0
        }
        let lastInDataChain = _.last(sourceStreams)
          .on('error', (error) => {
            reject(error)
          })
          .on('data', (data) => {
            _.forEach(this._processors, (processor) => {
              processor(data)
            })
            report.processed++
          })

        if (item.viaFlatter) {
          lastInDataChain = lastInDataChain
            .pipe(flattenStream)
            .on('error', (error) => {
              reject(error)
            })
        }
        lastInDataChain
          .pipe(_.first(targetStreams))

        _.last(targetStreams)
          .on('finish', () => {
            resolve(report)
          })
      })
    })
  }
}

/**
 * Processes data being replicated
 *
 * @callback Replicator~Processors
 * @param {} data Data
 */

module.exports = Replicator
