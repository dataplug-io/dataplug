const { Readable } = require('stream');

/**
 * Source output stream
 */
class SourceOutput extends Readable {
  /**
   * @constructor
   */
  constructor(params) {
    super({
      objectMode: true
    });

    this._params = params || {};
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
  _destroy(error, callback) {
    if (callback) {
      callback(error);
    }
  }
}

module.exports = SourceOutput;
