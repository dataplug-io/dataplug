const {
  Readable
} = require('stream');

/**
 * Source output stream
 *
 * @property {Source} source
 */
class SourceOutput extends Readable {
  /**
   * @constructor
   */
  constructor(source) {
    super({
      objectMode: true
    });

    this.source = source;
  }

  /**
   * Initialize the output stream
   *
   * @abstract
   * @param {Object} params
   */
  async _init(params) {
    throw new Error('Not implemented');
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  _read(size) {
    throw new Error('Not implemented');
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_destroy_err_callback
   */
  _destroy(err, callback) {
    if (callback) {
      callback(err);
    }
  }
}

module.exports = SourceOutput;
