const check = require('check-types')
const Source = require('./source')
const ReplicationChainBuilder = require('./replicationChainBuilder')

/**
 * Replicates data from source to target(s)
 */
class Replicator {
  /**
   * @constructor
   * @param {Source} [source=] Source to replicate
   * @param {} [sourceParams=] Source parameters
   */
  constructor (source = undefined, sourceParams = undefined) {
    check.assert.maybe.instance(source, Source)
    check.assert.maybe.object(sourceParams)

    this._defaultSource = source
    this._defaultSourceParams = sourceParams
  }

  /**
   * Adds specified target to replication chain
   *
   * @param {Target} target Replication target
   * @param {} targetParams Target parameters
   * @returns {ReplicationChainBuilder} Replication chain builder instance
   */
  to (target, targetParams) {
    check.assert.instance(this._defaultSource, Source)
    check.assert.object(this._defaultSourceParams)

    return new ReplicationChainBuilder()
      .from(this._defaultSource, this._defaultSourceParams)
      .to(target, targetParams)
  }

  /**
   * Adds specified transform to replication chain
   *
   * @param {Transform} transform Transform
   * @param {function} [builder=] Builder function
   * @returns {ReplicationChainBuilder} Replication chain builder instance
   */
  via (transform, builder = undefined) {
    check.assert.instance(this._defaultSource, Source)
    check.assert.object(this._defaultSourceParams)

    return new ReplicationChainBuilder()
      .from(this._defaultSource, this._defaultSourceParams)
      .via(transform, builder)
  }
}

module.exports = Replicator
