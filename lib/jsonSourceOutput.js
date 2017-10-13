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
    this._parserCompleteHandler = (json) => {
      this._handleParserComplete(json);
    };
    this._parserFailureHandler = (reason) => {
      this._handleParserFailure(reason);
    };

    this._input = null;
    this._endOfInputHandler = () => {
      this._handleEndOfInput();
    };

    this._entrySelector = '!.*';
  }

  /** @inheritdoc */
  _read(size) {
    //console.log('read', size);
    if (this._input) {
      return;
    }

    //console.log('create stream');
    this._createInputStream()
      .then((input) => {
        this._useInputStream(input);
      })
      .catch((reason) => {
        const error = new Error('Failed to create input stream:' + JSON.stringify(reason));

        this._reset(error);
        setImmediate(() => { this.push(null); });
        this.emit('error', error);

        //console.error('failed to create input stream', error);
      });
  }

  /** @inheritdoc */
  _destroy(error, callback) {
    this._reset(error);
    if (callback) {
      callback(error);
    }
  }

  /** @inheritdoc */
  _reset(error) {
    if (this._parser) {
      this._parser.abort();
    }
    if (this._input) {
      this._input.destroy(error);
    }

    this._detach();
    this._parser = null;
    this._input = null;
  }

  /**
   * Detaches from parser and input
   */
  _detach() {
    if (this._parser) {
      this._parser.removeListener('done', this._parserCompleteHandler);
      this._parser.removeListener('fail', this._parserFailureHandler);
    }
    if (this._input) {
      this._input.removeListener('end', this._endOfInputHandler);
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
    //console.log('entry push');

    const shouldPause = !this.push(entry);
    if (shouldPause) {
      //console.log('pause');
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
      .on('end', this._endOfInputHandler);

    this._parser = this._configureParser(oboe(input))
      .done(this._parserCompleteHandler)
      .fail(this._parserFailureHandler);
  }

  /**
   * Handles end of input
   */
  _handleEndOfInput() {
    //console.log('input end, push nothing');
    this.push(null);
  }

  /**
   * Configures next input stream. Returns false if no such stream exists.
   *
   * @return {Boolean} True if next input stream exists
   */
  _configureNextInputStream(lastJson) {
    return false;
  }

  /**
   * Handles end-of-data from parser
   */
  _handleParserComplete(json) {
    //console.log('done', json);

    if (!this._configureNextInputStream(json)) {
      return;
    }

    //console.log('create new stream');
    this._detach();
    this._createInputStream()
      .then((newInput) => {
        //console.log('new input stream created');
        this._reset();
        this._useInputStream(newInput);
      })
      .catch((reason) => {
        //console.error('failed to create new input stream', reason);
        const error = new Error('Failed to create next input stream:' + JSON.stringify(reason));
        this._reset(error);
        this.push(null);
        this.emit('error', error);
      });
  }

  /**
   * Handles parser failure
   */
  _handleParserFailure(reason) {
    //console.log('fail', reason);
    this.emit('error', new Error('Parser failed:' + JSON.stringify(reason)));
  }
}

module.exports = JsonSourceOutput;
