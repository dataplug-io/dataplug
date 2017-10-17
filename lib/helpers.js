const _ = require('lodash');

/**
 * Checks if given object is a stream
 *
 * @return {Boolean} True if obj is stream
 */
function isStream(obj) {
  return obj && _.isFunction(obj.resume) && _.isFunction(obj.pause) && _.isFunction(obj.pipe);
}

/**
 * Evaluates given value
 */
function evaluate(value, ...args) {
  if (_.isFunction(value)) {
    return value(...args);
  }
  return value;
}

module.exports = {
  isStream,
  evaluate
}
