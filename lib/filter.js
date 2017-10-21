const {
  Transform
} = require('stream');

/**
 * Filters the object stream
 *
 * @property {Filter~Callback} filterCallback
 */
class Filter extends Transform {
  /**
   * @constructor
   * @param {Filter~Callback} filterCallback
   */
  constructor(filterCallback) {
    super({
      objectMode: true
    });

    this.filterCallback = filterCallback;
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(chunk, encoding, callback) {
    let accepted;
    try {
      accepted = !this.filterCallback || this.filterCallback(chunk);
    } catch (error) {
      callback(error, null);
      return;
    }
    callback(null, accepted ? chunk : null);
  }
}

module.exports = Filter;
