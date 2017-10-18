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

    this._initialParams = this._params = params || {};
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  _read(size) {
    throw new Error('Not implemented');
  }
}

module.exports = SourceOutput;
