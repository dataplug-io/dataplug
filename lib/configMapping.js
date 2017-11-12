const _ = require('lodash')
const check = require('check-types')

/**
 * Configuration mapping
 */
class ConfigMapping {
  /**
   * @constructor
   * @param {ConfigMapping|Object} [other=undefined] Other mapping to clone
   */
  constructor (other = undefined) {
    check.assert.maybe.object(other)

    if (other) {
      _.forOwn(other, (declaration, selector) => {
        this[selector] = _.clone(declaration)
      })
    }
  }

  /**
   * Returns copy of this mapping, extended using specified modifier
   *
   * @param {ConfigMapping~Modifier} [modifier=undefined] An modifier functor
   * @return {ConfigMapping} Copy of this mapping
   */
  extended (modifier = undefined) {
    check.assert.maybe.function(modifier)

    const clone = new ConfigMapping(this)
    return modifier ? modifier(clone) : clone
  }

  /**
   * Remaps a parameter matched to specified selector using specified mapper
   *
   * @param {string|RegExp} selector Parameter selector, supports regexp
   * @param {ConfigMapping~Mapper} mapper Mapper function
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  remap (selector, mapper) {
    check.assert(check.any([
      check.nonEmptyString(selector),
      check.instance(selector, RegExp)
    ]))
    check.assert.function(mapper)

    // Convert regexp to a string, if needed
    if (_.isRegExp(selector)) {
      selector = selector.toString().match(/^\/(.*?)\/[gimuy]?$/)[1]
    }

    if (this[selector] && this[selector].mapper) {
      throw new Error(`'${selector}' selector already mapped`)
    }

    this[selector] = Object.assign({}, this[selector], {
      mapper
    })

    return this
  }

  /**
   * Renames a parameter
   *
   * @param {string|RegExp} selector Parameter selector, supports regexp
   * @param {string} newName New name for mathing parameter
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  rename (selector, newName) {
    check.assert.nonEmptyString(newName)

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
   * @param {string|RegExp} selector Parameter selector, supports regexp
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
   * @param {string|RegExp} selector Parameter selector, supports regexp
   * @param {ConfigMapping~DefaulValueFactory} defaultValueFactory Default value factory
   * @return {ConfigMapping} This instance (for chaining purposes)
   */
  default (selector, defaultValueFactory) {
    // TODO: check selector type
    check.assert.function(defaultValueFactory)

    if (this[selector] && this[selector].defaultValueFactory) {
      throw new Error(`'${selector}' selector already has default value factory`)
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
    check.assert.object(values)

    let mappedValues = {}
    _.forOwn(this, (declaration, selector) => {
      let wasMatched = false
      if (declaration.mapper) {
        let matched = 0
        _.forOwn(values, (parameterValue, parameter) => {
          if (!parameter.match(new RegExp(selector))) {
            return
          }

          const mappedValue = declaration.mapper(parameterValue, parameter, values)
          if (!mappedValue) {
            return
          }

          mappedValues = Object.assign({}, mappedValues, mappedValue)
          matched++
        })
        wasMatched = matched > 0
      }

      if (!wasMatched && declaration.defaultValueFactory) {
        const defaultValue = declaration.defaultValueFactory()
        if (defaultValue) {
          let defaultValueObject = {}
          defaultValueObject[selector] = defaultValue
          mappedValues = Object.assign({}, mappedValues, defaultValueObject)
        }
      }
    })

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
