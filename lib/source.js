/**
 * Source declaration
 *
 * @property {Collection} collection Source collection
 * @property {Object} outputClass
 */
class Source {
  /**
   * @abstract
   * @param {Collection} collection Source collection
   * @param {Object} outputClass
   */
  constructor(collection, outputClass) {
    this.collection = collection;
    this.outputClass = outputClass;
  }

  /**
   * Creates output iterator
   *
   * @abstract
   * @param {Object} params
   */
  async createOutput(params) {
    //TODO:
    return function*() {
      yield {};
      yield {};
      yield {};
    }();
  }
}

module.exports = Source;
