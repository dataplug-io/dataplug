const _ = require('lodash')

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
    if (other) {
      for (let name in other) {
        this[name] = _.cloneDeep(other[name])
      }
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
    for (let parameterName in other) {
      if (!forced && this[parameterName]) {
        throw new Error(`'${parameterName}' parameter already declared`)
      }

      this[parameterName] = _.cloneDeep(other[parameterName])
    }

    return this
  }

  /**
   * Declares parameters
   *
   * @param {ConfigDeclaration|Object} other Other configuration to include
   * @param {Boolean} [forced=false] Overwrite parameter declaration
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  parameters (parameters, forced = false) {
    for (let name in parameters) {
      if (!forced && this[name]) {
        throw new Error(`'${name}' parameter already declared`)
      }

      const declaration = parameters[name]
      this[name] = _.cloneDeep(declaration)
    }

    return this
  }

  /**
   * Declares a parameter
   *
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  parameter (name, declaration, forced = false) {
    if (!forced && this[name]) {
      throw new Error(`'${name}' parameter already declared`)
    }

    this[name] = _.cloneDeep(declaration)

    return this
  }

  /**
   * Marks specified parameter as mutually-exclusive in regards to other specified parameters.
   *
   * @param {string} name Parameter name
   * @return {ConfigDeclaration} This instance (for chaining purposes)
   */
  conflicts (name, ...otherNames) {
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
   * @return {ConfigDeclaration} Copy of this declaration
   */
  extended (extender) {
    return extender(new ConfigDeclaration(this))
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

    for (let parameterName in this) {
      const declaration = this[parameterName]
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

      schema.properties[parameterName] = property
    }

    return schema
  }
}

module.exports = ConfigDeclaration
