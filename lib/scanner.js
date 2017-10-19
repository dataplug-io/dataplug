const {
  Transform
} = require('stream');

/**
 * Scans the object stream
 *
 * @property {Scanner~Callback} scannerCallback
 */
class Scanner extends Transform {
  /**
   * @constructor
   * @param {Scanner~Callback} scannerCallback
   */
  constructor(scannerCallback) {
    super({
      objectMode: true
    });

    this.scannerCallback = scannerCallback;
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(chunk, encoding, callback) {
    try {
      if (this.scannerCallback) {
        this.scannerCallback(chunk);
      }
    } catch (error) {
      callback(error, chunk);
      return;
    }
    callback(null, chunk);
  }
}

module.exports = Scanner;
