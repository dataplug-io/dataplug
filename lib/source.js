const _ = require('lodash')
const Ajv = require('ajv')
const ConfigDeclaration = require('./configDeclaration')

/**
 * Source declaration
 *
 * Usually exposed as require('specific-dataplug').someCollection.source
 *
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
class Source {
  /**
   * @param {ConfigDeclaration|Object} configDeclaration Config declaration
   * @param {Source~OutputFactory} [outputFactory=undefined] Output factory
   */
  constructor (configDeclaration, outputFactory = undefined) {
    this.configDeclaration = new ConfigDeclaration(configDeclaration)
    this._outputFactory = outputFactory
  }

  /**
   * Creates output object stream
   *
   * @param {Object} params Parameters
   * @returns {Readable} Output object stream
   */
  createOutput (params) {
    if (!this._outputFactory) {
      throw new Error('No factory specified for this source')
    }

    params = _.cloneDeep(params)
    const validator = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true
    })
      .compile(this.configDeclaration.toJSONSchema())
    if (!validator(params)) {
      throw new Error('Invalid parameters: ' + JSON.stringify(validator.errors))
    }

    return this._outputFactory(params)
  }
}

/**
 * Creates instance of SourceOutput impementation.
 *
 * @callback Source~OutputFactory
 * @param {Object} params Parameters
 * @return {Readable} Output object stream
 */

module.exports = Source
