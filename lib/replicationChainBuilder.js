const _ = require('lodash')
const check = require('check-types')
const { Writable, Transform } = require('stream')
const Promise = require('bluebird')
const replicate = require('./replicate')
const Source = require('./source')
const Target = require('./target')

class ReplicationChainBuilder {
  /**
   * @constructor
   *
   * @param {ReplicationChainBuilder} [that=] Builder to copy
   */
  constructor (that = undefined) {
    check.assert.maybe.instance(that, ReplicationChainBuilder)

    if (!that) {
      this._chains = []
    } else {
      this._chains = that._chains.map((chain) => _.clone(chain))
    }
  }

  /**
   * Starts a chain using specified source
   *
   * @param {Source} source Source to replicate
   * @param {} sourceParams Source parameters
   * @param {function} [builder=] Chain builder
   */
  from (source, sourceParams, builder = undefined) {
    check.assert.instance(source, Source)
    check.assert.object(sourceParams)
    check.assert.maybe.function(builder)

    if (builder) {
      const chainBuilder = new ReplicationChainBuilder()
        .from(source, sourceParams)
      builder(chainBuilder)
      this._chains = chainBuilder.toChains().concat(this._chains)
      return this
    }

    if (this._chains.length > 0 && ReplicationChainBuilder._isComplete(_.last(this._chains))) {
      throw new Error('Chain is incomplete')
    }

    const output = source.createOutput(sourceParams)
    this._chains.push([].concat(output))

    return this
  }

  /**
   * Adds a transform to last chain
   *
   * @param {Transform} transform Transform
   * @param {function} [builder=] Builder function
   */
  via (transform, builder = undefined) {
    check.assert.instance(transform, Transform)
    check.assert.maybe.function(builder)

    if (builder) {
      const chainBuilder = new ReplicationChainBuilder(this)
        .via(transform)
      builder(chainBuilder)
      this._chains = chainBuilder.toChains().concat(this._chains)
      return this
    }

    const lastChain = _.last(this._chains)
    if (this._chains.length < 0) {
      throw new Error('No chain exists')
    }
    if (ReplicationChainBuilder._isComplete(_.last(this._chains))) {
      throw new Error('Chain is already complete')
    }
    lastChain.push(transform)

    return this
  }

  /**
   * Ends a chain using specified target
   *
   * @param {Target} target Replication target
   * @param {} targetParams Target parameters
   * @returns This instance for chaining purposes
   */
  to (target, targetParams) {
    check.assert.instance(target, Target)
    check.assert.object(targetParams)

    const lastChain = _.last(this._chains)
    if (this._chains.length < 0) {
      throw new Error('No chain exists')
    }
    if (ReplicationChainBuilder._isComplete(_.last(this._chains))) {
      this._chains.push(lastChain.slice(0, -1))
    }
    const input = target.createInput(targetParams)
    _.last(this._chains).push(...([].concat(input)))

    return this
  }

  /**
   * Replicates data
   *
   * @param {boolean} [abortOnError=] True to abort on error, false otherwise
   * @param {function} [chainsCallback=]
   */
  replicate (abortOnError = false, chainsCallback = undefined) {
    let chains = this.toChains()
    if (chainsCallback) {
      chains = chainsCallback(chains) || chains
    }
    return Promise.all(Promise.map(chains, (chain) => replicate(chain, abortOnError)))
  }

  /**
   * Returns complete chains
   */
  toChains () {
    return _
      .filter(this._chains, (chain) => ReplicationChainBuilder._isComplete(chain))
      .map((chain) => _.clone(chain))
  }

  /**
   * Checks if chain is complete
   */
  static _isComplete (chain) {
    if (chain.length <= 1) {
      return false
    }

    const lastItemInChain = _.last(chain)
    return Promise.resolve(lastItemInChain) === lastItemInChain ||
      _.isFunction(lastItemInChain.then) ||
      (lastItemInChain instanceof Writable && !(lastItemInChain instanceof Transform))
  }
}

module.exports = ReplicationChainBuilder
