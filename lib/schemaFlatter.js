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
  constructor (pathSeparator = undefined, generatedFieldPrefix = undefined, placeholder = undefined, scopeSpecifier = undefined) {
    this._naming = new FlatterNaming(pathSeparator, generatedFieldPrefix, placeholder, scopeSpecifier)
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
   * Flattens given definition as entity with specified name
   *
   * @param {string} collectionName Collection name
   * @param {string} entityFqName Entity fully-qualified name
   * @param {Object} definition Entity JSON definition
   * @param {Object} definitionPointer Pointer to entity JSON definition
   * @param {Object} jsonSchema JSON schema
   * @param {Object} entities Object with flattened entities
   * @param {Object} [foreignFields=undefined] Object with foreign fields from parent entities
   * @returns {Object} Flattened entity
   */
  _flattenEntity (collectionName, entityFqName, definition, definitionPointer, jsonSchema, entities, foreignFields = undefined) {
    if (entities[definitionPointer] && entities[definitionPointer].origin === definitionPointer) {
      return
    }

    if (entities[definitionPointer] && entities[definitionPointer].origin !== definitionPointer) {
      throw new Error(`'${entityFqName}' has duplicate definition at '${definitionPointer}', previously seen at '${entities[definitionPointer].origin}'`)
    }

    if (definition.type !== 'object') {
      throw new Error(`'${entityFqName}' definition must have an 'object' type`)
    }

    const requiredFields = definition.required || []
    const properties = definition.properties ? _.keys(definition.properties) : []
    const objectProperties = []
    const arrayProperties = []
    const hasAdditionalProperties =
      definition.additionalProperties &&
      definition.additionalProperties !== false
    const hasPatternProperties =
      definition.patternProperties &&
      _.size(definition.patternProperties) > 0
    let entity = entities[entityFqName] = {
      origin: definitionPointer
    }

    // Process foreign fields references
    foreignFields = foreignFields ? _.cloneDeep(foreignFields) : {}
    _.forOwn(foreignFields, (foreignField) => {
      foreignField.reference.depth = (foreignField.reference.depth || 0) + 1
    })

    // By default, foreign identity fields are added as fields
    let fields = _.cloneDeep(foreignFields)
    let relations = {}

    // For all sub-entities, relate to this
    _.forOwn(foreignFields, (foreignField, foreignFieldName) => {
      foreignField.relation.entity = entityFqName
      foreignField.relation.field = foreignFieldName
    })

    // Collect scalar fields
    properties.forEach((propertyName) => {
      let propertyDefinition = definition.properties[propertyName]
      if (propertyDefinition.$ref) {
        propertyDefinition = JsonUtils.resolveReference(propertyDefinition.$ref, jsonSchema)
      }

      const types = _.isArray(propertyDefinition.type)
        ? propertyDefinition.type
        : (propertyDefinition.type ? [propertyDefinition.type] : [])
      const validTypes = _.without(types, 'null')
      if (validTypes.length > 1) {
        throw new Error(`Not supported: '${propertyName}' of '${entityFqName}' has multiple types`)
      }
      if (validTypes.length === 0 && types.length > 0) {
        const unsupportedTypes = types.join(', ')
        throw new Error(`Not supported: '${propertyName}' of '${entityFqName}' has unsupported type(s) ${unsupportedTypes}`)
      }
      const type = _.head(types)
      const enumValues = propertyDefinition.enum || []
      const nullable = types.includes('null') || enumValues.includes(null)

      if (type === 'object') {
        const hasProperties =
          propertyDefinition.properties &&
          _.size(propertyDefinition.properties) > 0
        const hasAdditionalProperties =
          propertyDefinition.additionalProperties &&
          propertyDefinition.additionalProperties !== false
        const hasPatternProperties =
          propertyDefinition.patternProperties &&
          _.size(propertyDefinition.patternProperties) > 0
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
      if (propertyDefinition.default !== undefined) {
        field.default = propertyDefinition.default
      }
      if (requiredFields.includes(propertyName)) {
        field.identity = true
      }
      if (enumValues.length > 0) {
        field.type = 'enum'
        field.enum = nullable ? _.without(enumValues, null) : enumValues
      } else if (type === 'string') {
        if (propertyDefinition.format === 'date-time') {
          field.type = 'datetime'
        } else if (propertyDefinition.format === 'date') {
          field.type = 'date'
        } else if (propertyDefinition.format === 'time') {
          field.type = 'time'
        } else {
          field.type = type
        }
      } else if (type === 'integer') {
        if (propertyDefinition.format === 'timestamp') {
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
        // For sub-entities, add own required property as foreign field
        const foreignFieldName = this._naming.getForeignFieldName(entityFqName, propertyName)
        let foreignField = foreignFields[foreignFieldName] = _.cloneDeep(field)
        foreignField.reference = {
          entity: entityFqName,
          field: propertyName
        }
        foreignField.relation = _.cloneDeep(foreignField.reference)
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
      let propertyDefinition = definition.properties[propertyName]
      let propertyDefinitionPointer = `${definitionPointer}/properties/${propertyName}`
      let subentityFqName
      if (propertyDefinition.$ref) {
        propertyDefinitionPointer = propertyDefinition.$ref
        const subentityName = this._naming.pointerToEntityName(propertyDefinition.$ref)
        subentityFqName = this._naming.getEntityFqName(collectionName, subentityName)
        propertyDefinition = JsonUtils.resolveReference(propertyDefinition.$ref, jsonSchema)
      } else {
        subentityFqName = this._naming.getEntityFqName(entityFqName, propertyName)
      }

      if (entityFqName === subentityFqName) {
        throw new Error(`Not supported: '${entityFqName}' has a relation to itself via '${propertyName}' property`)
      }

      this._flattenEntity(collectionName, subentityFqName, propertyDefinition, propertyDefinitionPointer, jsonSchema, entities, foreignFields)
      relations[subentityFqName] = 'one-to-one'
    })

    // Handle array-'properties' as one-to-many relations
    arrayProperties.forEach((propertyName) => {
      let propertyDefinition = definition.properties[propertyName]
      if (propertyDefinition.$ref) {
        propertyDefinition = JsonUtils.resolveReference(propertyDefinition.$ref, jsonSchema)
      }

      if (_.isArray(propertyDefinition.items)) {
        throw new Error(`Not supported: '${entityFqName}' has a tuple array in '${propertyName}' property`)
      }

      let itemDefinition = propertyDefinition.items
      let itemDefinitionPointer = `${definitionPointer}/properties/${propertyName}/items`
      let subentityFqName
      if (itemDefinition.$ref) {
        itemDefinitionPointer = itemDefinition.$ref
        const subentityName = this._naming.pointerToEntityName(itemDefinition.$ref)
        subentityFqName = this._naming.getEntityFqName(collectionName, subentityName)
        itemDefinition = JsonUtils.resolveReference(itemDefinition.$ref, jsonSchema)
      } else {
        subentityFqName = this._naming.getEntityFqName(entityFqName, this._naming.getArrayFieldName(propertyName))
      }

      if (entityFqName === subentityFqName) {
        throw new Error(`Not supported: '${entityFqName}' has a relation to itself via '${propertyName}' property`)
      }

      let customDefinition
      const hasProperties =
        itemDefinition.properties &&
        _.size(itemDefinition.properties) > 0
      const hasAdditionalProperties =
        itemDefinition.additionalProperties &&
        itemDefinition.additionalProperties !== false
      const hasPatternProperties =
        itemDefinition.patternProperties &&
        _.size(itemDefinition.patternProperties) > 0
      if (!hasProperties && !hasAdditionalProperties && !hasPatternProperties) {
        customDefinition = itemDefinition = this._generateArrayItemDefinition(itemDefinition.type)
      }

      const subEntity = this._flattenEntity(collectionName, subentityFqName, itemDefinition, itemDefinitionPointer, jsonSchema, entities, foreignFields)
      if (customDefinition) {
        subEntity.customSchema = customDefinition
      }
      relations[subentityFqName] = 'one-to-many'
    })

    // There may be several patternProperties and up to one additionalProperties schemas, so
    // entities may differ
    let variadicPropertiesCount = 0

    // Handle subentities from 'additionalProperties' as one-to-many relations
    if (hasAdditionalProperties) {
      let propertyDefinition = definition.additionalProperties
      let propertyDefinitionPointer = `${definitionPointer}/additionalProperties`

      let subentityFqName
      if (propertyDefinition.$ref) {
        propertyDefinitionPointer = propertyDefinition.$ref
        const subentityName = this._naming.pointerToEntityName(propertyDefinition.$ref)
        subentityFqName = this._naming.getEntityFqName(collectionName, subentityName)
        propertyDefinition = JsonUtils.resolveReference(propertyDefinition.$ref, jsonSchema)
      } else {
        subentityFqName = this._naming.getVariadicPropertiesEntityFqName(entityFqName, variadicPropertiesCount++)
      }

      if (entityFqName === subentityFqName) {
        throw new Error(`Not supported: '${entityFqName}' has a relation to itself via variadic property`)
      }

      if (propertyDefinition === true) {
        propertyDefinition = this._generateVariadicPropertiesDefinition()
      } else {
        const hasProperties =
          propertyDefinition.properties &&
          _.size(propertyDefinition.properties) > 0
        const hasAdditionalProperties =
          propertyDefinition.additionalProperties &&
          propertyDefinition.additionalProperties !== false
        const hasPatternProperties =
          propertyDefinition.patternProperties &&
          _.size(propertyDefinition.patternProperties) > 0
        if (!hasProperties && !hasAdditionalProperties && !hasPatternProperties) {
          propertyDefinition = this._generateVariadicPropertiesDefinition(propertyDefinition.type)
        } else {
          propertyDefinition = _.cloneDeep(propertyDefinition)
          propertyDefinition.properties = propertyDefinition.properties || {}
          propertyDefinition.required = propertyDefinition.required || []

          const key = this._naming.getVariadicPropertiesKeyFieldName()
          propertyDefinition.properties[key] = {
            type: 'string'
          }
          propertyDefinition.required.push(key)
        }
      }

      const subEntity = this._flattenEntity(collectionName, subentityFqName, propertyDefinition, propertyDefinitionPointer, jsonSchema, entities, foreignFields)
      subEntity.customSchema = propertyDefinition
      relations[subentityFqName] = 'one-to-many'
    }

    // Handle subentities from 'patternProperties' as one-to-many relations
    if (hasPatternProperties) {
      _.forOwn(definition.patternProperties, (propertyDefinition, propertyPattern) => {
        let propertyDefinitionPointer = `${definitionPointer}/patternProperties/${propertyPattern}`
        let subentityFqName
        if (propertyDefinition.$ref) {
          propertyDefinitionPointer = propertyDefinition.$ref
          const subentityName = this._naming.pointerToEntityName(propertyDefinition.$ref)
          subentityFqName = this._naming.getEntityFqName(collectionName, subentityName)
          propertyDefinition = JsonUtils.resolveReference(propertyDefinition.$ref, jsonSchema)
        } else {
          subentityFqName = this._naming.getVariadicPropertiesEntityFqName(entityFqName, variadicPropertiesCount++)
        }

        if (entityFqName === subentityFqName) {
          throw new Error(`Not supported: '${entityFqName}' has a relation to itself via variadic property`)
        }

        const hasProperties =
          propertyDefinition.properties &&
          _.size(propertyDefinition.properties) > 0
        const hasAdditionalProperties =
          propertyDefinition.additionalProperties &&
          propertyDefinition.additionalProperties !== false
        const hasPatternProperties =
          propertyDefinition.patternProperties &&
          _.size(propertyDefinition.patternProperties) > 0
        if (!hasProperties && !hasAdditionalProperties && !hasPatternProperties) {
          propertyDefinition = this._generateVariadicPropertiesDefinition(propertyDefinition.type)
        } else {
          propertyDefinition = _.cloneDeep(propertyDefinition)
          propertyDefinition.properties = propertyDefinition.properties || {}
          propertyDefinition.required = propertyDefinition.required || []

          const key = this._naming.getVariadicPropertiesKeyFieldName()
          propertyDefinition.properties[key] = {
            type: 'string'
          }
          propertyDefinition.required.push(key)
        }

        const subEntity = this._flattenEntity(collectionName, subentityFqName, propertyDefinition, propertyDefinitionPointer, jsonSchema, entities, foreignFields)
        subEntity.customSchema = propertyDefinition
        relations[subentityFqName] = 'one-to-many'
      })
    }

    if (_.size(fields) > 0) {
      entity.fields = fields
    }
    if (_.size(relations) > 0) {
      entity.relations = relations
    }

    return entity
  }

  /**
   * Generates array item definition for given type
   *
   * @param {string} type Type of the element
   * @returns {Object} JSON schema definition
   */
  _generateArrayItemDefinition (type) {
    let itemDefinition = {
      type: 'object',
      properties: {}
    }

    const value = this._naming.getArrayItemValueFieldName()
    itemDefinition.properties[value] = {
      type
    }

    return itemDefinition
  }

  /**
   * Generates variadic properties definition
   *
   * @param {string} type Type of the element
   * @returns {Object} JSON schema definition
   */
  _generateVariadicPropertiesDefinition (type) {
    let propertyDefinition = {
      type: 'object',
      properties: {},
      required: []
    }

    const key = this._naming.getVariadicPropertiesKeyFieldName()
    propertyDefinition.properties[key] = {
      type: 'string'
    }
    propertyDefinition.required.push(key)

    const value = this._naming.getVariadicPropertiesValueFieldName()
    propertyDefinition.properties[value] = {
      type: type || ['object', 'null']
    }

    return propertyDefinition
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
      if (_.size(properties) > 0) {
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
 * @property {string} origin JSON pointer to part of original JSON schema
 * @property {Object} [fields=undefined] Object with fields
 * @property {Object} [relations=undefined] Object describing relations to other entities
 * @property {Object} [customSchema=undefined] Custom JSON schema
 */

 /**
  * @typedef SchemaFlatter~Reference
  * @property {integer} depth Distance by JSON pointer to object, owning the field
  * @property {string} entity Referenced entity
  * @property {string} field Referenced entity field
  */

/**
 * @typedef SchemaFlatter~Relation
 * @property {string} entity Related entity
 * @property {string} field Related entity field
 */

/**
 * @typedef SchemaFlatter~EntityField
 * @property {string} type Type of the field
 * @property {[]} enum Possible values of the enum
 * @property {boolean} nullable True if field can be null, false otherwise
 * @property {} default Default value
 * @property {boolean} identity True if field is part of identity used to identify an instance
 * @property {SchemaFlatter~Reference} [reference=undefined] If field is foreign, describes reference
 * @property {SchemaFlatter~Relation} [relation=undefined] If field defines a relation, describes relation
 */

module.exports = SchemaFlatter
