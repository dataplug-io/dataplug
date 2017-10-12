/**
 * Source output interface
 *
 * @property {Source} source
 */
class SourceOutput {
  /**
   * @constructor
   */
  constructor(source) {
    this.source = source;
  }

  /**
   * Builds CLI
   */
  buildCli(yargs) {
    return yargs;
  }

  /**
   * Prepares data output
   *
   * @abstract
   * @param {Object} params
   */
  async prepare(params) {
    throw new Error('Not implemented');
  }

  /**
   * Creates data iterator
   *
   * @abstract
   */
  *data() {
    throw new Error('Not implemented');
  }
}

module.exports = SourceOutput;
