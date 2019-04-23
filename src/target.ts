// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { cloneDeep } from 'lodash'
import check from 'check-types'
import { Promise as BluebirdPromise } from 'bluebird'
import Ajv from 'ajv'
import { ConfigDeclaration } from './configDeclaration'
import { ConfigDeclarationParameter } from './configDeclarationParameter'

export type TargetStream =
  | NodeJS.WritableStream
  | PromiseLike<NodeJS.WritableStream>
  | Array<NodeJS.WritableStream | PromiseLike<NodeJS.WritableStream>>
  | PromiseLike<
      Array<NodeJS.WritableStream | PromiseLike<NodeJS.WritableStream>>
    >

export type InputFactory = (params: object) => TargetStream

/**
 * Target declaration
 * Usually exposed as require('specific-dataplug').someCollection.target
 *
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
export class Target {
  private readonly _inputFactory: InputFactory | null

  readonly configDeclaration: ConfigDeclaration

  /**
   * @param configDeclaration Config declaration
   * @param {InputFactory} [inputFactory=] Input factory
   */
  constructor(
    configDeclaration:
      | ConfigDeclaration
      | { [key: string]: ConfigDeclarationParameter },
    inputFactory?: InputFactory,
  ) {
    this.configDeclaration = new ConfigDeclaration(configDeclaration)
    this._inputFactory = inputFactory || null
  }

  /**
   * Creates input stream instance
   *
   * @param params Parameters
   * @returns Input object stream(s) chain
   */
  async createInput(params: Object): Promise<TargetStream> {
    check.assert.object(params)

    if (!this._inputFactory) {
      throw new Error('No factory specified for this target')
    }

    params = cloneDeep(params)
    const validator = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
    }).compile(this.configDeclaration.toJSONSchema())
    if (!validator(params)) {
      throw new Error('Invalid parameters: ' + JSON.stringify(validator.errors))
    }

    return BluebirdPromise.resolve<TargetStream>(this._inputFactory(params))
  }
}
