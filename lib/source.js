/**
 * Source declaration
 *
 * @property {Collection} collection Source collection
 * @property {Object} outputClass
 */
class Source {
  /**
   * @param {Collection} collection Source collection
   * @param {Object} outputClass
   */
  constructor(collection, outputClass) {
    this.collection = collection;
    this.outputClass = outputClass;
  }

  /**
   * Creates output instance
   *
   * @returns {SourceOutput}
   */
  async createOutput(params) {
    return new this.outputClass(this);
  }
}

module.exports = Source;
