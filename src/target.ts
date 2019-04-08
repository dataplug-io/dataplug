// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { cloneDeep } from 'lodash'
import check from 'check-types'
import Ajv from 'ajv'
import ConfigDeclaration from './configDeclaration'

/**
 * Target declaration
 * Usually exposed as require('specific-dataplug').someCollection.target
 */
export default class Target {
  private configDeclaration: ConfigDeclaration
  private readonly _inputFactory: Function | undefined
  /**
   * @param configDeclaration Config declaration
   * @param {Target~InputFactory} [inputFactory=] Input factory
   */
  constructor(
    configDeclaration: {} | ConfigDeclaration | Object,
    inputFactory?: Function,
  ) {
    this.configDeclaration = new ConfigDeclaration(configDeclaration)
    this._inputFactory = inputFactory
  }

  /**
   * Creates input stream instance
   *
   * @param params Parameters
   * @returns {Writable|Writable[]} Input object stream(s) chain
   */
  async createInput(params: Object) {
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

    return this._inputFactory(params)
  }
}
