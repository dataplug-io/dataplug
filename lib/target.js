const _ = require('lodash');
const Ajv = require('ajv');
const {
  ConfigDeclaration
} = require('./config');
const helpers = require('./helpers');

/**
 * Target declaration
 *
 * Usually exposed as require('specific-dataplug').someCollection.target
 *
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
class Target {
  /**
   * @param {ConfigDeclaration|Object|Function} configDeclaration Config declaration
   * @param {Target~InputFactory} inputFactory Input factory
   */
  constructor(configDeclaration, inputFactory) {
    this.configDeclaration = new ConfigDeclaration(helpers.evaluate(configDeclaration));
    this._inputFactory = inputFactory;
  }

  /**
   * Creates input stream instance
   *
   * @returns {TargetInput}
   */
  async createInput(params) {
    params = _.cloneDeep(params);
    const validator = new Ajv({
        allErrors: true,
        removeAdditional: true,
        useDefaults: true
      })
      .compile(this.configDeclaration.toJSONSchema());
    if (!validator(params)) {
      throw new Error('Invalid parameters: ' + JSON.stringify(validator.errors));
    }

    return this._inputFactory(params);
  }
}

/**
 * Creates instance of TargetInput impementation.
 *
 * @callback Target~InputFactory
 * @param {Object} params Parameters for TargetInput
 * @return {TargetInput} Instance of TargetInput
 */

module.exports = Target;
