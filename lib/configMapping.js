const _ = require('lodash')

/**
 * Configuration mapping
 */
class ConfigMapping {
  /**
   * @constructor
   * @param {ConfigMapping|Object} [other=undefined] Other mapping to clone
   */
  constructor (other = undefined) {
    if (other) {
      for (let selector in other) {
        this[selector] = _.clone(other[selector])
      }
    }
  }

  /**
   * Returns copy of this mapping, extended using specified modifier
   *
   * @param {ConfigMapping~Modifier} modifier An modifier functor
   * @return {ConfigMapping} Copy of this mapping
   */
  extended (modifier) {
    return modifier(new ConfigMapping(this))
  }

  /**
   * Remaps a parameter matched to specified selector using specified mapper
   *
   * @param {string} selector Parameter selector, supports regexp
   * @param {ConfigMapping~Mapper} mapper Mapper function
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  remap (selector, mapper) {
    if (this[selector] && this[selector].mapper) {
      throw new Error(`'${selector}' selector already mapped`)
    }
    if (!_.isFunction(mapper)) {
      throw new Error('Mapper is not a function')
    }

    this[selector] = Object.assign({}, this[selector], {
      mapper
    })

    return this
  }

  /**
   * Renames a parameter
   *
   * @param {string} selector Parameter selector, supports regexp
   * @param {string} newName New name for mathing parameter
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  rename (selector, newName) {
    return this.remap(selector, (value) => {
      if (!value) {
        return
      }
      let mapped = {}
      mapped[newName] = value
      return mapped
    })
  }

  /**
   * Uses parameter as-is
   *
   * @param {string} selector Parameter selector, supports regexp
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  asIs (selector) {
    return this.remap(selector, (value, currentName) => {
      if (!value) {
        return
      }
      let mapped = {}
      mapped[currentName] = value
      return mapped
    })
  }

  /**
   * Sets default value factory for the selector
   *
   * @param {string} selector Parameter selector, supports regexp
   * @param {ConfigMapping~DefaulValueFactory} defaultValueFactory Default value factory
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  default (selector, defaultValueFactory) {
    if (this[selector] && this[selector].defaultValueFactory) {
      throw new Error(`'${selector}' selector already has default value factory`)
    }
    if (!_.isFunction(defaultValueFactory)) {
      throw new Error('Default value factory is not a function')
    }

    this[selector] = Object.assign({}, this[selector], {
      defaultValueFactory
    })

    return this
  }

  /**
   * Applies mappings to given values
   *
   * @param {Object} values Values to map
   * @return {Object} Mapped values
   */
  apply (values) {
    let mappedValues = {}

    for (let selector in this) {
      const declaration = this[selector]

      let wasMatched = false
      if (declaration.mapper) {
        for (let parameter in values) {
          if (!parameter.match(selector)) {
            continue
          }

          const mappedValue = declaration.mapper(values[parameter], parameter, values)
          if (!mappedValue) {
            continue
          }

          mappedValues = Object.assign({}, mappedValues, mappedValue)
          wasMatched = true
        }
      }

      if (!wasMatched && declaration.defaultValueFactory) {
        const defaultValue = declaration.defaultValueFactory()
        if (defaultValue) {
          let defaultValueObject = {}
          defaultValueObject[selector] = defaultValue
          mappedValues = Object.assign({}, mappedValues, defaultValueObject)
        }
      }
    }

    return mappedValues
  }
}

/**
 * Maps parameter
 *
 * @callback ConfigMapping~Mapper
 * @param {Object} value Parameter value
 * @param {string} name Parameter name
 * @param {Object} params Parameter values
 * @return {Object} Object with mapped parameter
 */

 /**
  * Default value factory
  *
  * @callback ConfigMapping~DefaulValueFactory
  * @return {Object} Default value
  */

/**
 * Modifies given ConfigMapper instance
 *
 * @callback ConfigMapping~Modifier
 * @param {ConfigMapping} mapper Instance to modify
 * @returns {ConfigMapping} Modified instance
 */

/**
 * Mapping declaration
 *
 * @typedef ConfigMapping~Declaration
 * @property {ConfigMapping~Mapper} mapper Mapper
 * @property {ConfigMapping~DefaulValueFactory} defaultValueFactory Default value factory
 */

module.exports = ConfigMapping
