import { last, clone, isFunction, filter } from 'lodash'
import check from 'check-types'
import { Writable, Transform } from 'stream'
import Promise from 'bluebird'
import replicate from './replicate'
import Source from './source'
import Target from './target'

export interface ReplicationChainBuilderCallback {
  (builder: ReplicationChainBuilder): void
}
export class ReplicationChainBuilder {
  private _chains: any[]

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
  ) {
    if (builder) {
      const chainBuilder = new ReplicationChainBuilder().from(
        source,
        sourceParams,
      )
      builder(chainBuilder)
      this._chains = chainBuilder.toChains().concat(this._chains)
      return this
    }

    if (
      this._chains.length > 0 &&
      ReplicationChainBuilder._isComplete(last(this._chains))
    ) {
      throw new Error('Chain is incomplete')
    }

    const output = source.createOutput(sourceParams)
    // @ts-ignore
    this._chains.push([].concat(output))

    return this
  }

  /**
   * Adds a transform to last chain
   *
   * @param transform Transform
   * @param builder Builder function
   */
  via(transform: Transform, builder?: ReplicationChainBuilderCallback) {
    if (builder) {
      const chainBuilder = new ReplicationChainBuilder(this).via(transform)
      builder(chainBuilder)
      this._chains = chainBuilder.toChains().concat(this._chains)
      return this
    }

    const lastChain = last(this._chains)
    if (this._chains.length < 0) {
      throw new Error('No chain exists')
    }
    if (ReplicationChainBuilder._isComplete(last(this._chains))) {
      throw new Error('Chain is already complete')
    }
    lastChain.push(transform)

    return this
  }

  /**
   * Ends a chain using specified target
   *
   * @param target Replication target
   * @param targetParams Target parameters
   * @returns This instance for chaining purposes
   */
  to(target: Target, targetParams: any) {
    check.assert.object(targetParams)

    const lastChain = last(this._chains)
    if (this._chains.length < 0) {
      throw new Error('No chain exists')
    }
    if (ReplicationChainBuilder._isComplete(last(this._chains))) {
      this._chains.push(lastChain.slice(0, -1))
    }
    const input = target.createInput(targetParams)
    // @ts-ignore
    last(this._chains).push(...[].concat(input))

    return this
  }

  /**
   * Replicates data
   */
  replicate(chainsCallback?: Function) {
    let chains = this.toChains()
    if (chainsCallback) {
      chains = chainsCallback(chains) || chains
    }
    return Promise.all(Promise.map(chains, chain => replicate(chain)))
  }

  /**
   * Returns complete chains
   */
  toChains() {
    return filter(this._chains, chain =>
      ReplicationChainBuilder._isComplete(chain),
    ).map(chain => clone(chain))
  }

  /**
   * Checks if chain is complete
   */
  static _isComplete(chain: any) {
    if (chain.length <= 1) {
      return false
    }

    const lastItemInChain = last(chain)
    return (
      Promise.resolve(lastItemInChain) === lastItemInChain ||
      // @ts-ignore
      isFunction(lastItemInChain.then) ||
      (lastItemInChain instanceof Writable &&
        !(lastItemInChain instanceof Transform))
    )
  }
}
