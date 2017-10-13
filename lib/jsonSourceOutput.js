const oboe = require('oboe');
const SourceOutput = require('./sourceOutput');

/**
 * Processes input stream as JSON using Oboe.js
 *
 * @property {string} entrySelector Entry selector, default is '!.*'. See {@link http://oboejs.com/api#pattern-matching}
 */
class JsonSourceOutput extends SourceOutput {
  /** @inheritdoc */
  async _init(params) {
    await super._init(params);
    this._parser = null;
    this._input = null;
    this._entrySelector = '!.*';
  }

  /** @inheritdoc */
  _read(size) {
    if (this._input) {
      return;
    }

    //console.log('create stream');
    this._createInputStream()
      .then((input) => {
        this._useInputStream(input);
      })
      .catch((reason) => {
        //console.error('failed to create input stream', reason);
      });
  }

  /** @inheritdoc */
  _destroy(err, callback) {
    this._reset();
    if (callback) {
      callback(err);
    }
  }

  /** @inheritdoc */
  _reset() {
    if (this._parser) {
      this._parser.abort();
      this._parser = null;
    }
    if (this._input) {
      this._input.destroy(err);
      this._input = null;
    }
  }

  /**
   * Configures parser
   */
  _configureParser(parser) {
    return parser
      .node(this._entrySelector, (node) => {
        this._handleOutputEntry(node);
        return oboe.drop;
      })
      .node('*', (node) => {});
  }

  /**
   * Processes output entry
   */
  _handleOutputEntry(entry) {
    //console.log('entry');

    const shouldPause = !this.push(entry);
    if (shouldPause) {
      console.log('pause');
    }
  }

  /**
   * Creates input stream
   *
   * @abstract
   * @return {Readable} Readable stream
   */
  async _createInputStream() {
    throw new Error('Not implemented');
  }

  /**
   * Starts using specified stream
   */
  _useInputStream(input) {
    this._input = input;
    input
      .on('end', () => {
        //console.log('input end');
      });
    this._parser = this._configureParser(oboe(input))
      .done((json) => {
        //console.log('done', json);

        if (this._configureNextInputStream(json)) {
          //console.log('create new stream');
          this._createInputStream()
            .then((newInput) => {
              this._reset();
              this._useInputStream(newInput);
            })
            .catch((reason) => {
              //console.error('failed to create new input stream', reason);
              this._reset();
            });
        }
      })
      .fail(() => {
        console.log('fail');
        this._reset();
        this.push(null);
      });
  }

  /**
   * Configures next input stream. Returns false if no such stream exists.
   *
   * @return {Boolean} True if next input stream exists
   */
  _configureNextInputStream(lastJson) {
    return false;
  }
}

module.exports = JsonSourceOutput;
