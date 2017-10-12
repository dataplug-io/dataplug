/**
 * Source declaration
 *
 * @property {Collection} collection Source collection
 */
class Source {
  /**
   * @param {Collection} collection Source collection
   * @param {Object} outputPrototype
   * @param {Function} cliBuilder
   */
  constructor(collection, outputPrototype, cliBuilder) {
    this.collection = collection;
    this._outputPrototype = outputPrototype;
    this._cliBuilder = cliBuilder;
  }

  /**
   * Builds CLI
   */
  buildCli(yargs) {
    if (this._cliBuilder) {
      yargs = this._cliBuilder(yargs);
    }
    return yargs;
  }

  /**
   * Creates output instance
   *
   * @returns {SourceOutput}
   */
  async createOutput(params) {
    return new this._outputPrototype(this);
  }
}

module.exports = Source;
