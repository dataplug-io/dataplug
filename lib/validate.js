const oboe = require('oboe');
const Promise = require('bluebird');
const helpers = require('./helpers');

/**
 * Callback for data validator.
 *
 * @callback ProcessedEntryHandler
 * @param {Object} entry
 * @param {Boolean} validationResult
 * @return {Boolean} Returns false if validating needs to stop.
 */

/**
 * Validates input using validator.
 *
 * Allows to interrupt the process using handler.
 *
 * @param {Stream|String|Object|Object[]} input
 * @param {Function} validator
 * @param {ProcessedEntryHandler} processedEntryHandler
 */
function validate(input, validator, processedEntryHandler) {
  return new Promise((resolve, reject) => {
    let isInputValid = true;
    const processEntry = (entry) => {
      const isEntryValid = validator(entry);
      isInputValid = isInputValid && isEntryValid;

      if (processedEntryHandler && processedEntryHandler(entry, isEntryValid) === false) {
        return false;
      }

      return true;
    };

    if (helpers.isStream(input)) {
      oboe(input)
        .node('!.*', function(entry) {
          if (!processEntry(entry)) {
            this.abort();
            resolve(isInputValid);
          }
          return oboe.drop;
        })
        .done((json) => {
          resolve(isInputValid);
        })
        .fail(reject);
    } else if (typeof input === 'string') {
      const entry = JSON.parse(input);
      processEntry(entry);
      resolve(isInputValid);
    } else if (Array.isArray(input)) {
      input.every((entry) => {
        if (!processEntry(entry)) {
          return false;
        }
        return true;
      });
      resolve(isInputValid);
    } else {
      const entry = input;
      processEntry(entry);
      resolve(isInputValid);
    }
  });
}

module.exports = validate;
