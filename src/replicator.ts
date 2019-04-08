// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import check from 'check-types'
import { Transform } from 'stream'
import Source from './source'
import {
  ReplicationChainBuilder,
  ReplicationChainBuilderCallback,
} from './replicationChainBuilder'
import Target from './target'

/**
 * Replicates data from source to target(s)
 */
export default class Replicator {
  private readonly _defaultSource: any
  private readonly _defaultSourceParams: any
  /**
   * @constructor
   * @param source Source to replicate
   * @param sourceParams Source parameters
   */
  constructor(source?: Source, sourceParams?: Object) {
    this._defaultSource = source
    this._defaultSourceParams = sourceParams
  }

  /**
   * Adds specified target to replication chain
   *
   * @param target Replication target
   * @param targetParams Target parameters
   * @returns Replication chain builder instance
   */
  to(target: Target, targetParams: any) {
    check.assert.instance(this._defaultSource, Source)
    check.assert.object(this._defaultSourceParams)

    return new ReplicationChainBuilder()
      .from(this._defaultSource, this._defaultSourceParams)
      .to(target, targetParams)
  }

  /**
   * Adds specified transform to replication chain
   *
   * @param transform Transform
   * @param builder Builder function
   * @returns Replication chain builder instance
   */
  via(transform: Transform, builder?: ReplicationChainBuilderCallback) {
    check.assert.instance(this._defaultSource, Source)
    check.assert.object(this._defaultSourceParams)

    return new ReplicationChainBuilder()
      .from(this._defaultSource, this._defaultSourceParams)
      .via(transform, builder)
  }
}
