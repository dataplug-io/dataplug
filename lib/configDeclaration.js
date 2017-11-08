const _ = require('lodash')
const check = require('check-types')

/**
 * Configuration declaration
 *
 * Each property of instance is a parameter declaration
 */
class ConfigDeclaration {
  /**
   * @constructor
   * @param {ConfigDeclaration|Object} [other=undefined] Other configuration to clone
   */
  constructor (other = undefined) {
    check.assert.maybe.object(other)

    if (other) {
      _.forOwn(other, (value, name) => {
        this[name] = _.cloneDeep(value)
      })
    }
  }

  /**
   * Includes declaraions from other configuration.
   *
   * @param {ConfigDeclaration|Object} other Other configuration to include
   * @param {Boolean} [forced=false] Overwrite parameter declaration
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  include (other, forced = false) {
    check.assert.object(other)
    check.assert.boolean(forced)

    _.forOwn(other, (value, name) => {
      if (!forced && this[name]) {
        throw new Error(`'${name}' parameter already declared`)
      }

      this[name] = _.cloneDeep(value)
    })

    return this
  }

  /**
   * Declares parameters
   *
   * @param {ConfigDeclaration|Object} parameters Other configuration to include
   * @param {boolean} [forced=false] Overwrite parameter declaration
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  parameters (parameters, forced = false) {
    check.assert.object(parameters)
    check.assert.boolean(forced)

    _.forOwn(parameters, (value, name) => this.parameter(name, value, forced))

    return this
  }

  /**
   * Declares a parameter
   *
   * @param {string} name Parameter name
   * @param {ConfigDeclaration~ParameterDefinition} definition Parameter definition
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  parameter (name, definition, forced = false) {
    check.assert.string(name)
    check.assert.object(definition)
    check.assert.boolean(forced)

    if (!forced && this[name]) {
      throw new Error(`'${name}' parameter already declared`)
    }

    this[name] = _.cloneDeep(definition)

    return this
  }

  /**
   * Marks specified parameter as mutually-exclusive in regards to other specified parameters.
   *
   * @param {string} name Parameter name
   * @param {...string} otherNames Conflicted parameter names
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  conflicts (name, ...otherNames) {
    check.assert.string(name)
    check.assert.array.of.string(otherNames)

    if (this[name] === undefined) {
      throw new Error(`'${name}' parameter is not declared`)
    }
    if (!otherNames || otherNames.length < 1) {
      throw new Error('At least one conflicting name must be specified')
    }
    otherNames.every((otherName) => {
      if (this[otherName] === undefined) {
        throw new Error(`'${otherName}' parameter is not declared`)
      }

      return true
    })

    let declaration = this[name]
    declaration.conflicts = otherNames.concat(declaration.conflicts || [])

    otherNames.forEach((otherName) => {
      let otherDeclaration = this[otherName]
      otherDeclaration.conflicts = [name].concat(otherDeclaration.conflicts || [])
    })

    return this
  }

  /**
   * Returns copy of this declaration, extended using specified extender
   *
   * @param {ConfigDeclaration~Modifier} [modifier=undefined] An modifier functor
   * @return {ConfigDeclaration} Copy of this declaration
   */
  extended (modifier = undefined) {
    check.assert.maybe.function(modifier)

    const clone = new ConfigDeclaration(this)
    return modifier ? modifier(clone) : clone
  }

  /**
   * Converts to JSON schema
   *
   * @returns {Object} JSON schema
   */
  toJSONSchema () {
    let schema = {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: []
    }

    _.forOwn(this, (declaration, parameterName) => {
      let property = {}

      if (declaration.description) {
        property.description = declaration.description
      }
      if (declaration.type) {
        property.type = declaration.type
      }
      if (declaration.item) {
        property.items = {
          type: declaration.format
        }
      }
      if (declaration.format) {
        if (property.items) {
          property.items.format = declaration.format
        } else {
          property.format = declaration.format
        }
      }
      if (declaration.enum) {
        property.enum = declaration.enum
      }
      if (declaration.default) {
        property.default = declaration.default
      }
      if (declaration.required) {
        schema.required.push(parameterName)
      }
      // TODO: if (declaration.conflicts) {
      //  property.default = declaration.conflicts;
      // }
      // not { dependencies: ["", ""] }

      schema.properties[parameterName] = _.cloneDeep(property)
    })

    return schema
  }
}

/**
 * @typedef {Object} ConfigDeclaration~ParameterDefinition
 * @property {string} [description]
 * @property {string} [type]
 * @property {string} [item]
 * @property {string} [format]
 * @property {string[]} [enum]
 * @property {} [default]
 * @property {boolean} [required]
 * @property {string[]} [conflicts]
 */

/**
 * Modifies given ConfigDeclaration instance
 *
 * @callback ConfigDeclaration~Modifier
 * @param {ConfigDeclaration} declaration Instance to modify
 * @returns {ConfigDeclaration} Modified instance
 */

module.exports = ConfigDeclaration
