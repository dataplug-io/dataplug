const _ = require('lodash');

/**
 * Configuration declaration
 */
class ConfigDeclaration {
  /** @constructor */
  constructor(other = undefined) {
    if (other) {
      for (let parameterName in other) {
        if (this[parameterName]) {
          continue;
        }

        const otherParameter = other[parameterName];
        if (_.isObject(otherParameter)) {
          this[parameterName] = _.cloneDeep(otherParameter);
        } else {
          this[parameterName] = otherParameter;
        }
      }
    }
  }

  /**
   * Includes declaraions from other configuration.
   *
   * @return {ConfigDeclaration} Returns this instance for chaining
   */
  include(other) {
    for (let parameterName in other) {
      if (this[parameterName]) {
        throw new Error(`'${parameterName}' parameter already declared`);
      }

      const otherParameter = other[parameterName];
      if (_.isObject(otherParameter)) {
        this[parameterName] = _.cloneDeep(otherParameter);
      } else {
        this[parameterName] = otherParameter;
      }
    }

    return this;
  }

  /**
   * Declares parameters
   *
   * @return {ConfigDeclaration} Returns this instance for chaining
   */
  parameters(parameters) {
    for (let name in parameters) {
      if (this[name]) {
        throw new Error(`'${name}' parameter already declared`);
      }

      this[name] = parameters[name];
    }

    return this;
  }

  /**
   * Declares a parameter
   *
   * @return {ConfigDeclaration} Returns this instance for chaining
   */
  parameter(name, declaration) {
    if (this[name]) {
      throw new Error(`'${name}' parameter already declared`);
    }

    this[name] = declaration;

    return this;
  }

  conflicts(name, ...otherNames) {
    //TODO: implement
    return this;
  }

  /**
   * Returns copy of this decalration, extended using specified extender
   */
  extended(extender) {
    return extender(new ConfigDeclaration(this));
  }

  toJSONSchema() {
    let schema = {
      type: 'object',
      additionalProperties: false,
      properties: {}
    };

    for (let parameter in this) {
      const declaration = this[parameter];
      let property = {};

      property.type = declaration.type;
      property.default = declaration.default;

      schema.properties[parameter] = property;
    }

    return schema;
  }
}

module.exports = ConfigDeclaration;
