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
