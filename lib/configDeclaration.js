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
   * @param {ConfigDeclaration|Object} [that=] Other configuration to clone
   */
  constructor (that = undefined) {
    check.assert.maybe.object(that)

    if (that) {
      _.forOwn(that, (value, name) => {
        check.assert(ConfigDeclaration.isValidParameterDefinition(value))

        this[name] = _.cloneDeep(value)
      })
    }
  }

  /**
   * Includes declaraions from specified configuration.
   *
   * @param {ConfigDeclaration|Object} that Other configuration to include
   * @param {boolean} [forced=] Overwrite parameter declaration
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  include (that, forced = false) {
    check.assert.object(that)
    check.assert.boolean(forced)

    _.forOwn(that, (value, name) => {
      check.assert(ConfigDeclaration.isValidParameterDefinition(value))

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
   * @param {boolean} [forced=] Overwrite parameter declaration
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  parameters (parameters, forced = false) {
    return this.include(parameters, forced)
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
    check.assert(ConfigDeclaration.isValidParameterDefinition(definition))
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

    const names = [name].concat(otherNames)
    if (names.length < 2) {
      throw new Error('At least two conflicting names must be specified')
    }
    const undefinedName = _.find(names, (name) => !this[name])
    if (undefinedName) {
      throw new Error(`'${undefinedName}' parameter is not declared`)
    }

    _.forEach(names, (name) => {
      const parameter = this[name]
      parameter.conflicts = _.without(names, name).concat(parameter.conflicts || [])
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
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: []
    }

    _.forOwn(this, (declaration, parameterName) => {
      const property = {}
      if (declaration.description !== undefined) {
        property.description = declaration.description
      }
      if (declaration.type !== undefined) {
        property.type = declaration.type
      }
      if (declaration.item !== undefined) {
        property.items = {
          type: declaration.item
        }
      }
      if (declaration.format !== undefined) {
        if (property.items) {
          property.items.format = declaration.format
        } else {
          property.format = declaration.format
        }
      }
      if (declaration.enum !== undefined) {
        property.enum = declaration.enum
      }
      if (declaration.default !== undefined) {
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

  /**
   * Checks if parameter defintion is valid
   */
  static isValidParameterDefinition (definition) {
    return check.object(definition) &&
      check.maybe.string(definition.description) &&
      check.maybe.string(definition.type) &&
      check.maybe.string(definition.item) &&
      check.maybe.string(definition.format) &&
      check.maybe.array.of.string(definition.enum) &&
      check.maybe.boolean(definition.required) &&
      check.maybe.array.of.string(definition.conflicts)
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
