const { Writable } = require('stream');

/**
 * Target input stream
 */
class TargetInput extends Writable {
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
   * https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback_1
   */
  _write(chunk, encoding, callback) {
    throw new Error('Not implemented');
  }

  /**
   * https://nodejs.org/api/stream.html#stream_writable_writev_chunks_callback
   */
  _writev(chunks, callback) {
    throw new Error('Not implemented');
  }
}

module.exports = TargetInput;
