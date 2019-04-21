// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { last, clone, filter } from 'lodash'
import check from 'check-types'
import { Promise as BluebirdPromise } from 'bluebird'
import {
  replicate,
  isReplicationChainComplete,
  ReplicationChain,
  ReplicationChainElement,
} from './replicate'
import { Source } from './source'
import { Target } from './target'
import { TransformStream } from './stream'

export type ReplicationChainBuilderCallback = (
  builder: ReplicationChainBuilder,
) => void

export type ReplicationChainBuilderChainsCallback = (
  chains: ReplicationChain[],
) => ReplicationChain[]

export class ReplicationChainBuilder {
  private _chains: ReplicationChain[]

  /**
   * @constructor
   *
   * @param that Builder to copy
   */
  constructor(that?: ReplicationChainBuilder) {
    if (!that) {
      this._chains = []
    } else {
      this._chains = that._chains.map(chain => clone(chain))
    }
  }

  /**
   * Starts a chain using specified source
   *
   * @param source Source to replicate
   * @param sourceParams Source parameters
   * @param builder Chain builder
   */
  from(
    source: Source,
    sourceParams: Object,
    builder?: ReplicationChainBuilderCallback,
  ): ReplicationChainBuilder {
    if (builder) {
      const chainBuilder = new ReplicationChainBuilder().from(
        source,
        sourceParams,
      )
      builder(chainBuilder)
      this._chains = chainBuilder.toChains().concat(this._chains)

      return this
    }

    const previousChain = last(this._chains)
    if (previousChain && !isReplicationChainComplete(previousChain, false)) {
      throw new Error('Previous chain is incomplete')
    }

    const output = source.createOutput(sourceParams)
    this._chains.push(
      ([] as ReplicationChain).concat(output as ReplicationChainElement),
    )

    return this
  }

  /**
   * Adds a transform to last chain
   *
   * @param transform Transform
   * @param builder Builder function
   */
  via(
    transform: TransformStream,
    builder?: ReplicationChainBuilderCallback,
  ): ReplicationChainBuilder {
    if (builder) {
      const chainBuilder = new ReplicationChainBuilder(this).via(transform)
      builder(chainBuilder)
      this._chains = chainBuilder.toChains().concat(this._chains)

      return this
    }

    const lastChain = last(this._chains)
    if (!lastChain) {
      throw new Error('No chain exists')
    }
    if (isReplicationChainComplete(lastChain, false)) {
      throw new Error('Chain is already complete')
    }
    lastChain.push(...([] as ReplicationChain).concat(transform))

    return this
  }

  /**
   * Ends a chain using specified target
   *
   * @param target Replication target
   * @param targetParams Target parameters
   * @returns This instance for chaining purposes
   */
  to(target: Target, targetParams: any): ReplicationChainBuilder {
    check.assert.object(targetParams)

    const lastChain = last(this._chains)
    if (!lastChain) {
      throw new Error('No chain exists')
    }
    if (isReplicationChainComplete(lastChain, false)) {
      this._chains.push(lastChain.slice(0, -1))
    }
    const targetStream = target.createInput(targetParams)
    last(this._chains)!.push(
      ...([] as ReplicationChain).concat(
        targetStream as ReplicationChainElement,
      ),
    )

    return this
  }

  /**
   * Replicates data
   */
  replicate(
    chainsCallback?: ReplicationChainBuilderChainsCallback,
  ): PromiseLike<{}[]> {
    let chains = this.toChains()
    if (chainsCallback) {
      chains = chainsCallback(chains) || chains
    }

    return BluebirdPromise.all(
      BluebirdPromise.map(chains, chain => replicate(chain)),
    )
  }

  /**
   * Returns complete chains
   */
  toChains(): ReplicationChain[] {
    return filter(this._chains, chain =>
      isReplicationChainComplete(chain, false),
    ).map(chain => clone(chain))
  }
}
