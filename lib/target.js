const _ = require('lodash')
const check = require('check-types')
const Ajv = require('ajv')
const ConfigDeclaration = require('./configDeclaration')

/**
 * Target declaration
 *
 * Usually exposed as require('specific-dataplug').someCollection.target
 *
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
class Target {
  /**
   * @param {ConfigDeclaration|Object} configDeclaration Config declaration
   * @param {Target~InputFactory} [inputFactory=] Input factory
   */
  constructor (configDeclaration, inputFactory = undefined) {
    check.assert.object(configDeclaration)
    check.assert.maybe.function(inputFactory)

    this.configDeclaration = new ConfigDeclaration(configDeclaration)
    this._inputFactory = inputFactory
  }

  /**
   * Creates input stream instance
   *
   * @param {Object} params Parameters
   * @returns {Writable|Writable[]} Input object stream(s) chain
   */
  async createInput (params) {
    check.assert.object(params)

    if (!this._inputFactory) {
      throw new Error('No factory specified for this target')
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

    return this._inputFactory(params)
  }
}

/**
 * Creates instance of TargetInput impementation.
 *
 * @callback Target~InputFactory
 * @param {Object} params Parameters
 * @returns {Writable|Writable[]} Input object stream(s) chain
 */

module.exports = Target
