const _ = require('lodash');
const Ajv = require('ajv');
const {
  ConfigDeclaration
} = require('./config');
const helpers = require('./helpers');

/**
 * Source declaration
 *
 * Usually exposed as require('specific-dataplug').someCollection.source
 *
 * @property {Collection} collection Source collection
 * @property {ConfigDeclaration} configDeclaration Configuration declaration
 */
class Source {
  /**
   * @param {Collection} collection Source collection
   * @param {ConfigDeclaration|Object|Function} configDeclaration Config declaration
   * @param {Source~OutputFactory} outputFactory Output factory
   */
  constructor(collection, configDeclaration, outputFactory) {
    this.collection = collection;
    this.configDeclaration = new ConfigDeclaration(helpers.evaluate(configDeclaration));
    this._outputFactory = outputFactory;
  }

  /**
   * Creates output stream instance
   *
   * @returns {SourceOutput}
   */
  async createOutput(params) {
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

    return this._outputFactory(params);
  }
}

/**
 * Creates instance of SourceOutput impementation.
 *
 * @callback Source~OutputFactory
 * @param {Object} params Parameters for SourceOutput
 * @return {SourceOutput} Instance of SourceOutput
 */

module.exports = Source;
