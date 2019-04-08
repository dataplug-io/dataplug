// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { cloneDeep } from 'lodash'
import Ajv from 'ajv'
import ConfigDeclaration from './configDeclaration'

/**
 * Source declaration
 *
 * Usually exposed as require('specific-dataplug').someCollection.source
 *
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
export default class Source {
  private readonly _outputFactory: any
  private readonly configDeclaration: ConfigDeclaration

  /**
   * @param configDeclaration Config declaration
   * @param outputFactory Output factory
   */
  constructor(
    configDeclaration: ConfigDeclaration | Object,
    outputFactory?: Function,
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
  async createOutput(params: Object) {
    if (!this._outputFactory) {
      throw new Error('No factory specified for this source')
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

    return this._outputFactory(params)
  }
}
