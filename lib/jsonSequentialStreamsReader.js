const _ = require('lodash');
const {
  Readable
} = require('stream');
const oboe = require('oboe');

/**
 * Reads input streams sequencially and transforms data to output object stream
 */
class JsonSequentialStreamsReader extends Readable {
  /**
   * @constructor
   * @param {JsonSequentialStreamsReader~InputStreamFactory} inputStreamFactory Input stream factory
   * @param {object} [inputStreamFactoryParams={}] Input stream factory parameters
   * @param {string} [selector='!.*'] Output data selector
   */
  constructor(inputStreamFactory, inputStreamFactoryParams = {}, selector = '!.*') {
    super({
      objectMode: true
    });

    this._selector = selector;

    this._onInputStreamEndedHandler = () => {
      this._onInputStreamEnded();
    };
    this._inputStreamFactory = inputStreamFactory;
    this._inputStreamFactoryParams = _.cloneDeep(inputStreamFactoryParams);
    this._inputStream = null;

    this._onParserDoneHandler = (json) => {
      this._onParserDone(json);
    };
    this._onParserFailHandler = (reason) => {
      this._onParserFail(reason);
    };
    this._parser = null;
  }

  /**
   * https://nodejs.org/api/stream.html#stream_readable_read_size_1
   */
  _read(size) {
    //console.log('read');
    if (!this._inputStream) {
      this._setupInputStream();
    }
  }

  /**
   * Setups input stream
   *
   * @param {Object} [previousData=undefined] Data obtained from previous input stream
   */
  _setupInputStream(previousData = undefined) {
    this._inputStreamFactory(this._inputStreamFactoryParams, previousData)
      .then((inputStream) => {
        //console.log('got input stream');
        this._inputStream = inputStream
          .on('end', this._onInputStreamEndedHandler);

        this._parser = oboe(inputStream)
          .done(this._onParserDoneHandler)
          .fail(this._onParserFailHandler)
          .node(this._selector, (node) => {
            this._onParserData(node);
            return oboe.drop;
          });
      })
      .catch((reason) => {
        //TODO: this._reset(error);
        setImmediate(() => {
          this.push(null);
        });

        if (reason) {
          this.emit('error', new Error('Failed to create input stream: ' + JSON.stringify(reason)));
        }
      });
  }

  /**
   * Detaches from parser and input
   */
  _detachFromCurrentStream() {
    if (this._parser) {
      this._parser.removeListener('done', this._onParserDoneHandler);
      this._parser.removeListener('fail', this._onParserFailHandler);
    }
    if (this._inputStream) {
      this._inputStream.removeListener('end', this._onInputStreamEndedHandler);
    }
  }

  /**
   * Handle end of input stream
   */
  _onInputStreamEnded() {
    //console.log('input end, push nothing');
    this.push(null);
  }

  /**
   * Handles parser complete event
   */
  _onParserDone(json) {
    //console.log('parser done');
    this._detachFromCurrentStream();
    this._setupInputStream(json);
  }

  /**
   * Handles parser failure event
   */
  _onParserFail(reason) {
    //console.log('parser fail', reason);
    this.emit('error', new Error('Parser failed: ' + JSON.stringify(reason)));
  }

  /**
   * Processes parsed data
   */
  _onParserData(data) {
    //console.log('parser data');
    this.push(data);
  }
};

module.exports = JsonSequentialStreamsReader;
