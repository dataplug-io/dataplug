const _ = require('lodash')
const FlatterNaming = require('./flatterNaming')
const JsonUtils = require('./jsonUtils')

/**
 * Flattens schema into a set of entities with scalar fields
 */
class SchemaFlatter {
  /**
   * @constructor
   * @param {string} [pathSeparator=undefined] Path separator
   * @param {string} [generatedFieldPrefix=undefined] Generated field prefix
   * @param {string} [placeholder=undefined] Placeholder
   */
  constructor (pathSeparator = undefined, generatedFieldPrefix = undefined, placeholder = undefined) {
    this._naming = new FlatterNaming(pathSeparator, generatedFieldPrefix, placeholder)

    this._defaultAdditionalPropertiesDeclaration = this._generateDefaultAdditionalPropertiesDeclaration()
  }

  get defaultAdditionalPropertiesDeclaration () {
    return this._defaultAdditionalPropertiesDeclaration
  }

  /**
   * Flattens specified schema
   *
   * @param {Object} jsonSchema JSON schema
   * @param {string} collectionName Collection name
   * @returns {Object} Object with flattened entities
   */
  flatten (jsonSchema, collectionName) {
    let entities = {}
    this._flattenEntity(collectionName, collectionName, jsonSchema, '#', jsonSchema, entities)
    return entities
  }

  /**
   * Flattens given declaration as entity with specified name
   *
   * @param {string} collectionName Collection name
   * @param {string} entityFqName Entity fully-qualified name
   * @param {Object} jsonDeclaration Entity JSON declaration
   * @param {Object} jsonDeclarationPointer Pointer to entity JSON declaration
   * @param {Object} jsonSchema JSON schema
   * @param {Object} entities Object with flattened entities
   * @param {Object} [foreignFields=undefined] Object with foreign fields from parent entities
   */
  _flattenEntity (collectionName, entityFqName, jsonDeclaration, jsonDeclarationPointer, jsonSchema, entities, foreignFields = undefined) {
    // Ensure declaration declares an object
    if (jsonDeclaration.type !== 'object') {
      throw new Error(`'${entityFqName}' declaration must have an 'object' type`)
    }

    const requiredFields = jsonDeclaration.required || []
    const properties = jsonDeclaration.properties ? _.keys(jsonDeclaration.properties) : []
    const objectProperties = []
    const arrayProperties = []
    const hasAdditionalProperties =
      jsonDeclaration.additionalProperties &&
      jsonDeclaration.additionalProperties !== false
    const hasPatternProperties =
      jsonDeclaration.patternProperties &&
      _.keys(jsonDeclaration.patternProperties).length > 0
    let entity = entities[entityFqName] = {
      origin: jsonDeclarationPointer
    }

    // Process foreign fields
    foreignFields = foreignFields ? _.cloneDeep(foreignFields) : {}
    _.forOwn(foreignFields, (foreignField) => {
      foreignField.reference.depth = (foreignField.reference.depth || 0) + 1
    })

    // By default, foreign identity fields are added as fields
    let fields = _.clone(foreignFields)
    let relatedEntities = []
    if (_.size(foreignFields) > 0) {
      entity.foreignFields = _.keys(foreignFields)
    }

    // Collect scalar fields
    properties.forEach((propertyName) => {
      let propertyDeclaration = jsonDeclaration.properties[propertyName]
      if (propertyDeclaration.$ref) {
        propertyDeclaration = JsonUtils.resolveReference(propertyDeclaration.$ref, jsonSchema)
      }

      const types = _.isArray(propertyDeclaration.type)
        ? propertyDeclaration.type
        : (propertyDeclaration.type ? [propertyDeclaration.type] : [])
      const validTypes = _.without(types, 'null')
      if (validTypes.length > 1) {
        throw new Error(`Not supported: '${propertyName}' of '${entityFqName}' has multiple types`)
      }
      if (validTypes.length === 0 && types.length > 0) {
        const unsupportedTypes = types.join(', ')
        throw new Error(`Not supported: '${propertyName}' of '${entityFqName}' has unsupported type(s) ${unsupportedTypes}`)
      }
      const type = _.head(types)
      const enumValues = propertyDeclaration.enum || []
      const nullable = types.includes('null') || enumValues.includes(null)

      if (type === 'object') {
        const hasProperties =
          propertyDeclaration.properties &&
          _.keys(propertyDeclaration.properties).length > 0
        const hasAdditionalProperties =
          propertyDeclaration.additionalProperties &&
          propertyDeclaration.additionalProperties !== false
        const hasPatternProperties =
          propertyDeclaration.patternProperties &&
          _.keys(propertyDeclaration.patternProperties).length > 0
        if (hasProperties || hasAdditionalProperties || hasPatternProperties) {
          objectProperties.push(propertyName)
          return
        }
      } else if (type === 'array') {
        arrayProperties.push(propertyName)
        return
      }

      let field = {}
      if (nullable) {
        field.nullable = nullable
      }
      if (propertyDeclaration.default !== undefined) {
        field.default = propertyDeclaration.default
      }
      if (requiredFields.includes(propertyName)) {
        field.identity = true
      }
      if (enumValues.length > 0) {
        field.type = 'enum'
        field.enum = nullable ? _.without(enumValues, null) : enumValues
      } else if (type === 'string') {
        if (propertyDeclaration.format === 'date-time') {
          field.type = 'datetime'
        } else if (propertyDeclaration.format === 'date') {
          field.type = 'date'
        } else if (propertyDeclaration.format === 'time') {
          field.type = 'time'
        } else {
          field.type = type
        }
      } else if (type === 'integer') {
        if (propertyDeclaration.format === 'timestamp') {
          field.type = 'timestamp'
        } else {
          field.type = type
        }
      } else if (type === 'boolean' || type === 'number') {
        field.type = type
      } else if (type === 'object') {
        field.type = 'json'
      } else {
        throw new Error(`Not supported: '${propertyName}' of '${entityFqName}' has '${type}' type`)
      }

      fields[propertyName] = field
      if (requiredFields.includes(propertyName)) {
        const foreignFieldName = this._naming.getForeignFieldName(entityFqName, propertyName)
        let foreignField = foreignFields[foreignFieldName] = _.cloneDeep(field)
        foreignField.reference = {
          entity: entityFqName,
          field: propertyName
        }
      }
    })

    // If there are object-'properties', array-'properties', additionalProperties or patternProperties, entity must have
    // an identifier fields
    if ((objectProperties.length || arrayProperties.length || hasAdditionalProperties || hasPatternProperties) &&
        _.size(foreignFields) === 0) {
      throw new Error(`Instance of '${entityFqName}' is not identifiable and can not have relations to other entities`)
    }

    // Handle object-'properties' as one-to-one relations
    objectProperties.forEach((propertyName) => {
      let propertyDeclaration = jsonDeclaration.properties[propertyName]
      let propertyDeclarationPointer = `${jsonDeclarationPointer}/properties/${propertyName}`
      let subentityFqName
      if (propertyDeclaration.$ref) {
        propertyDeclarationPointer = propertyDeclaration.$ref
        subentityFqName = this._naming.pointerToFqEntityName(propertyDeclaration.$ref)
        subentityFqName = this._naming.getEntityFqName(collectionName, subentityFqName)
        propertyDeclaration = JsonUtils.resolveReference(propertyDeclaration.$ref, jsonSchema)
      } else {
        subentityFqName = this._naming.getEntityFqName(entityFqName, propertyName)
      }

      if (entityFqName === subentityFqName) {
        throw new Error(`Not supported: '${entityFqName}' has a relation to itself via '${propertyName}' property`)
      }

      relatedEntities.push(subentityFqName)
      if (!entities[subentityFqName]) {
        this._flattenEntity(collectionName, subentityFqName, propertyDeclaration, propertyDeclarationPointer, jsonSchema, entities, foreignFields)
      }
    })

    // Handle array-'properties' as one-to-many relations
    arrayProperties.forEach((propertyName) => {
      let propertyDeclaration = jsonDeclaration.properties[propertyName]
      if (propertyDeclaration.$ref) {
        propertyDeclaration = JsonUtils.resolveReference(propertyDeclaration.$ref, jsonSchema)
      }

      if (_.isArray(propertyDeclaration.items)) {
        throw new Error(`Not supported: '${entityFqName}' has a tuple array in '${propertyName}' property`)
      }

      let itemDeclaration = propertyDeclaration.items
      let itemDeclarationPointer = `${jsonDeclarationPointer}/properties/${propertyName}/items`
      let subentityFqName
      if (itemDeclaration.$ref) {
        itemDeclarationPointer = itemDeclaration.$ref
        subentityFqName = this._naming.pointerToFqEntityName(itemDeclaration.$ref)
        subentityFqName = this._naming.getEntityFqName(collectionName, subentityFqName)
        itemDeclaration = JsonUtils.resolveReference(itemDeclaration.$ref, jsonSchema)
      } else {
        subentityFqName = this._naming.getEntityFqName(entityFqName, this._naming.getArrayFieldName(propertyName))
      }

      if (entityFqName === subentityFqName) {
        throw new Error(`Not supported: '${entityFqName}' has a relation to itself via '${propertyName}' property`)
      }

      relatedEntities.push(subentityFqName)
      if (!entities[subentityFqName]) {
        this._flattenEntity(collectionName, subentityFqName, itemDeclaration, itemDeclarationPointer, jsonSchema, entities, foreignFields)
      }
    })

    // There may be several patternProperties and up to one additionalProperties schemas, so
    // entities may differ
    let variadicPropertiesCount = 0

    // Handle subentities from 'additionalProperties' as one-to-many relations
    if (hasAdditionalProperties) {
      let propertyDeclaration = jsonDeclaration.additionalProperties
      let propertyDeclarationPointer = `${jsonDeclarationPointer}/additionalProperties`
      if (propertyDeclaration === true) {
        propertyDeclaration = this.defaultAdditionalPropertiesDeclaration
      }

      let subentityFqName
      if (propertyDeclaration.$ref) {
        propertyDeclarationPointer = propertyDeclaration.$ref
        subentityFqName = this._naming.pointerToFqEntityName(propertyDeclaration.$ref)
        subentityFqName = this._naming.getEntityFqName(collectionName, subentityFqName)
        propertyDeclaration = JsonUtils.resolveReference(propertyDeclaration.$ref, jsonSchema)
      } else {
        subentityFqName = this._naming.getVariadicPropertiesEntityFqName(entityFqName, variadicPropertiesCount++)
      }

      if (entityFqName === subentityFqName) {
        throw new Error(`Not supported: '${entityFqName}' has a relation to itself via variadic property`)
      }

      relatedEntities.push(subentityFqName)
      if (!entities[subentityFqName]) {
        this._flattenEntity(collectionName, subentityFqName, propertyDeclaration, propertyDeclarationPointer, jsonSchema, entities, foreignFields)
      }
    }

    // Handle subentities from 'patternProperties' as one-to-many relations
    if (hasPatternProperties) {
      _.forOwn(jsonDeclaration.patternProperties, (propertyDeclaration, propertyPattern) => {
        let propertyDeclarationPointer = `${jsonDeclarationPointer}/patternProperties/${propertyPattern}`
        let subentityFqName
        if (propertyDeclaration.$ref) {
          propertyDeclarationPointer = propertyDeclaration.$ref
          subentityFqName = this._naming.pointerToFqEntityName(propertyDeclaration.$ref)
          subentityFqName = this._naming.getEntityFqName(collectionName, subentityFqName)
          propertyDeclaration = JsonUtils.resolveReference(propertyDeclaration.$ref, jsonSchema)
        } else {
          subentityFqName = this._naming.getVariadicPropertiesEntityFqName(entityFqName, variadicPropertiesCount++)
        }

        if (entityFqName === subentityFqName) {
          throw new Error(`Not supported: '${entityFqName}' has a relation to itself via variadic property`)
        }

        relatedEntities.push(subentityFqName)
        if (!entities[subentityFqName]) {
          this._flattenEntity(collectionName, subentityFqName, propertyDeclaration, propertyDeclarationPointer, jsonSchema, entities, foreignFields)
        }
      })
    }

    if (_.keys(fields).length > 0) {
      entity.fields = fields
    }
    if (relatedEntities.length > 0) {
      entity.relatedEntities = relatedEntities
    }
  }

  /**
   * Generates default additional properties declaration
   */
  _generateDefaultAdditionalPropertiesDeclaration () {
    let propertyDeclaration = {
      type: 'object',
      properties: {},
      required: []
    }

    const key = this._naming.getVariadicPropertiesKeyFieldName()
    propertyDeclaration.properties[key] = {
      type: 'string'
    }
    propertyDeclaration.required.push(key)

    const value = this._naming.getVariadicPropertiesValueFieldName()
    propertyDeclaration.properties[value] = {
      type: ['object', 'null']
    }
    propertyDeclaration.required.push(value)

    return propertyDeclaration
  }

  /**
   * Converts specified flattened entities object to JSON schema
   *
   * @param {Object} jsonSchema JSON schema
   * @param {string} collectionName Collection name
   * @return {Object} JSON schema
   */
  flattenToJsonSchema (jsonSchema, collectionName) {
    return SchemaFlatter.toJsonSchema(this.flatten(jsonSchema, collectionName))
  }

  /**
   * Converts specified flattened entities object to JSON schema
   *
   * @param {Object} entities Object with flattened entities
   * @return {Object} JSON schema
   */
  static toJsonSchema (entities) {
    let schema = {
      type: 'object',
      definitions: {},
      properties: {}
    }
    _.forOwn(entities, (entity, entityName) => {
      let definition = schema.definitions[entityName] = {
        type: 'object'
      }
      let properties = {}
      let required = []
      _.forOwn(entity.fields, (field, fieldName) => {
        let property = properties[fieldName] = {}

        if (field.identity) {
          required.push(fieldName)
        }

        if (field.type === 'enum') {
          property.enum = field.enum.slice()
          if (field.nullable) {
            property.enum.push(null)
          }
        } else {
          property.type = []
          if (field.type === 'json') {
            property.type.push('object')
          } else if (field.type === 'datetime') {
            property.type = 'string'
            property.format = 'date-time'
          } else if (field.type === 'date') {
            property.type = 'string'
            property.format = 'date'
          } else if (field.type === 'time') {
            property.type = 'string'
            property.format = 'time'
          } else if (field.type === 'timestamp') {
            property.type = 'integer'
            property.format = 'timestamp'
          } else {
            property.type.push(field.type)
          }
          if (field.nullable) {
            property.type.push('null')
          }
        }
        if (field.default) {
          property.default = field.default
        }
      })
      if (_.keys(properties).length > 0) {
        definition.properties = properties
      }
      if (required.length > 0) {
        definition.required = required
      }
      schema.properties[entityName] = {
        type: 'array',
        items: {
          $ref: `#/definitions/${JsonUtils.escapeForPointer(entityName)}`
        }
      }
    })
    return schema
  }
}

/**
 * @typedef SchemaFlatter~Entity
 * @property {Object} fields Object with fields
 * @property {string[]} relatedEntities Array of related entities
 * @property {string} origin JSON pointer to part of original JSON schema
 * @property {string[]} foreignFields Array of foreign field names
 */

 /**
  * @typedef SchemaFlatter~Reference
  * @property {integer} depth Distance by JSON pointer to object, owning the field
  * @property {string} entity Referenced entity
  * @property {string} field Referenced entity field
  */

/**
 * @typedef SchemaFlatter~EntityField
 * @property {string} type Type of the field
 * @property {[]} enum Possible values of the enum
 * @property {boolean} nullable True if field can be null, false otherwise
 * @property {} default Default value
 * @property {boolean} identity True if field is part of identity used to identify an instance
 * @property {SchemaFlatter~Reference} [reference=undefined] If field is foreign, describes reference
 */

module.exports = SchemaFlatter