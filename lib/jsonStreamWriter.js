const _ = require('lodash');
const {
  Transform
} = require('stream');

/**
 * Transforms input object stream to output data stream
 */
class JsonStreamWriter extends Transform {
  /**
   * @constructor
   */
  constructor(replacer = undefined, space = undefined) {
    super({
      objectMode: false,
      readableObjectMode: false,
      writableObjectMode: true
    });

    this.replacer = _.isArray(replacer) ? _.cloneDeep(replacer) : space;
    this.space = space;
    this._opened = false;
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(chunk, encoding, callback) {
    let json;
    try {
      json = JSON.stringify(chunk, this.replacer, this.space);
    } catch (error) {
      callback(error, null);
      return;
    }
    if (this._opened) {
      json = `,${json}`;
    } else {
      json = `[${json}`;
      this._opened = true;
    }
    callback(null, json);
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_flush_callback
   * @override
   */
  _flush(callback) {
    this._opened = false;
    callback(null, ']');
  }
};

module.exports = JsonStreamWriter;
