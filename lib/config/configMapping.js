const _ = require('lodash');

/**
 * Configuration mapping
 */
class ConfigMapping {
  /** @constructor */
  constructor(other = undefined) {
    if (other) {
      for (let selector in other) {
        if (this[selector]) {
          continue;
        }

        const otherMapper = other[selector];
        this[selector] = otherMapper;
      }
    }
  }

  /**
   * Returns copy of this mapping, extended using specified extender
   */
  extended(extender) {
    return extender(new ConfigMapping(this));
  }

  /**
   * Maps a parameter matched to specified selector using specified mapping
   *
   * @param {string} selector
   * @param {ConfigMapping~Mapper} mapper
   * @return {ConfigMapping} Returns this instance for chaining
   */
  map(selector, mapper) {
    if (this[selector]) {
      throw new Error(`'${name}' selector already mapped`);
    }
    if (!_.isFunction(mapper)) {
      throw new Error('Mapper is not a function');
    }

    this[selector] = mapper;

    return this;
  }

  /**
   * Renames a parameter
   */
  rename(selector, newName) {
    return this.map(selector, (value, currentName) => {
      if (!value) {
        return;
      }
      let mapped = {};
      mapped[newName] = value;
      return mapped;
    });
  }

  /**
   * Uses parameter as-is
   */
  asIs(selector) {
    return this.map(selector, (value, currentName) => {
      if (!value) {
        return;
      }
      let mapped = {};
      mapped[currentName] = value;
      return mapped;
    });
  }

  /**
   * Applies mappings to given values
   *
   * @param {Object} values Values to map
   * @return {Object} Mapped values
   */
  apply(values) {
    let mappedValues = {};

    for (let selector in this) {
      for (let parameter in values) {
        const mapper = this[selector];
        const value = values[parameter];

        if (!parameter.match(selector)) {
          continue;
        }

        const mappedValue = mapper(value, parameter);
        if (!mappedValue) {
          continue;
        }

        mappedValues = Object.assign({}, mappedValues, mappedValue);
      }
    }

    return mappedValues;
  }
}

module.exports = ConfigMapping;
