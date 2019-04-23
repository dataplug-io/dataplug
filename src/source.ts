// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { cloneDeep } from 'lodash'
import Ajv from 'ajv'
import { Promise as BluebirdPromise } from 'bluebird'
import { ConfigDeclaration } from './configDeclaration'
import { ConfigDeclarationParameter } from './configDeclarationParameter'

export type SourceStream =
  | NodeJS.ReadableStream
  | PromiseLike<NodeJS.ReadableStream>
  | Array<NodeJS.ReadableStream | PromiseLike<NodeJS.ReadableStream>>
  | PromiseLike<
      Array<NodeJS.ReadableStream | PromiseLike<NodeJS.ReadableStream>>
    >

export type OutputFactory = (params: object) => SourceStream

/**
 * Source declaration
 *
 * Usually exposed as require('specific-dataplug').someCollection.source
 *
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
export class Source {
  private readonly _outputFactory: OutputFactory

  readonly configDeclaration: ConfigDeclaration

  /**
   * @param configDeclaration Config declaration
   * @param outputFactory Output factory
   */
  constructor(
    configDeclaration:
      | ConfigDeclaration
      | { [key: string]: ConfigDeclarationParameter },
    outputFactory: OutputFactory,
  ) {
    this.configDeclaration = new ConfigDeclaration(configDeclaration)
    this._outputFactory = outputFactory
  }

  /**
   * Creates output object stream
   *
   * @param params Parameters
   * @return Output object stream(s) chain
   */
  async createOutput(params: Object): Promise<SourceStream> {
    params = cloneDeep(params)
    const validator = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
    }).compile(this.configDeclaration.toJSONSchema())
    if (!validator(params)) {
      throw new Error('Invalid parameters: ' + JSON.stringify(validator.errors))
    }

    return BluebirdPromise.resolve<SourceStream>(this._outputFactory(params))
  }
}
