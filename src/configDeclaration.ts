import { forOwn, forEach, without, cloneDeep, find } from 'lodash'
import { ConfigDeclarationParameter } from './сonfigDeclarationParameter'
import { ConfigDeclarationJsonSchema } from './configDeclarationJsonSchema'

/**
 * Configuration declaration
 *
 * Each property of instance is a parameter declaration
 */
export default class ConfigDeclaration {
  constructor(that?: Object) {
    if (that) {
      forOwn(that, (value, name) => {
        this[name] = cloneDeep(value)
      })
    }
  }

  /**
   * Includes declarations from specified configuration.
   */
  include(that: Object, forced: boolean = false) {
    forOwn(that, (value, name) => {
      if (!forced && this[name]) {
        throw new Error(`'${name}' parameter already declared`)
      }

      this[name] = cloneDeep(value)
    })

    return this
  }

  /**
   * Declares parameters
   *
   * @param parameters Other configuration to include
   * @param forced Overwrite parameter declaration
   * @return This instance (for chaining purposes)
   */
  parameters(parameters: ConfigDeclaration | Object, forced: boolean = false) {
    return this.include(parameters, forced)
  }

  /**
   * Declares a parameter
   *
   * @param name Parameter name
   * @param definition Parameter definition
   * @param forced
   * @return This instance (for chaining purposes)
   */
  parameter(
    name: string,
    definition: {} | ConfigDeclarationParameter,
    forced: boolean = false,
  ) {
    if (!forced && this[name]) {
      throw new Error(`'${name}' parameter already declared`)
    }

    this[name] = cloneDeep(definition)

    return this
  }

  /**
   * Marks specified parameter as mutually-exclusive in regards to other specified parameters.
   *
   * @param name Parameter name
   * @param otherNames Conflicted parameter names
   * @return This instance (for chaining purposes)
   */
  conflicts(name: string, ...otherNames: string[]): ConfigDeclaration {
    const names = [name].concat(otherNames)
    if (names.length < 2) {
      throw new Error('At least two conflicting names must be specified')
    }
    const undefinedName = find(names, name => !this[name])
    if (undefinedName) {
      throw new Error(`'${undefinedName}' parameter is not declared`)
    }

    forEach(names, name => {
      const parameter = this[name]
      parameter.conflicts = without(names, name).concat(
        parameter.conflicts || [],
      )
    })

    return this
  }

  /**
   * Returns copy of this declaration, extended using specified extender
   *
   * @param modifier An modifier functor
   * @return Copy of this declaration
   */
  extended(modifier?: Function): ConfigDeclaration {
    const clone = new ConfigDeclaration(this)
    return modifier ? modifier(clone) : clone
  }

  /**
   * Converts to JSON schema
   *
   * @returns {Object} JSON schema
   */
  toJSONSchema() {
    const schema: ConfigDeclarationJsonSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: [],
    }

    forOwn(this, (declaration: any, parameterName: string) => {
      const property: any = {}
      if (declaration.description !== undefined) {
        property.description = declaration.description
      }
      if (declaration.type !== undefined) {
        property.type = declaration.type
      }
      if (declaration.item !== undefined) {
        property.items = {
          type: declaration.item,
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
      //  property.default = declaration.conflicts
      // }
      // not { dependencies: ["", ""] }

      schema.properties[parameterName] = cloneDeep(property)
    })

    return schema
  }
}
