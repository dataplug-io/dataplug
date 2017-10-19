const {
  Transform
} = require('stream');
const oboe = require('oboe');

/**
 * Transforms input data stream to output object stream
 */
class JsonStreamReader extends Transform {
  /**
   * @constructor
   * @param {string} [selector='!.*'] Output data selector
   */
  constructor(selector = '!.*') {
    super({
      objectMode: false,
      readableObjectMode: true,
      writableObjectMode: false
    });

    // Configure Oboe.js to expect data being fed externally
    this._parser = oboe()
      .done(() => {
        this._doneParsing = true;
        this._notifyOnTransformed();
      })
      .fail((error) => {
        this._notifyOnTransformed(error);
      })
      .node(selector, (node) => {
        this._doneParsing = false;
        this.push(node);
        this._notifyOnTransformed();
        return oboe.drop;
      });
  }

  /**
   * Notifies that chunk of data was transformed
   *
   * @returns {boolean} True if notification was sent, false otherwise.
   */
  _notifyOnTransformed(error = null) {
    if (!this._onTransformed) {
      return false;
    }

    this._onTransformed(error, null);
    this._onTransformed = null;
    return true;
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(chunk, encoding, callback) {
    this._onTransformed = callback;
    this._parser.emit('data', chunk.toString());
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_flush_callback
   * @override
   */
  _flush(callback) {
    if (!!this._doneParsing) {
      callback(null, null);
    } else {
      this._onTransformed = callback;
    }
    this._parser.emit('end');
  }
}

module.exports = JsonStreamReader;
