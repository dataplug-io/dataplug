const _ = require('lodash')
const Ajv = require('ajv')
const FlatterNaming = require('./flatterNaming')
const JsonUtils = require('./jsonUtils')
const SchemaFlatter = require('./schemaFlatter')

/**
 * Flattens data
 */
class DataFlatter {
  /**
   * @constructor
   * @param {Object} jsonSchema JSON schema of the data to flatten
   * @param {string} collectionName Collection name
   * @param {string} [pathSeparator=undefined] Path separator
   * @param {string} [generatedFieldPrefix=undefined] Generated field prefix
   * @param {string} [placeholder=undefined] Placeholder
   */
  constructor (jsonSchema, collectionName, pathSeparator = undefined, generatedFieldPrefix = undefined, placeholder = undefined) {
    this._jsonSchema = _.cloneDeep(jsonSchema)
    this._collectionName = collectionName
    this._naming = new FlatterNaming(pathSeparator, generatedFieldPrefix, placeholder)

    this._prepareSchema()

    const ajv = new Ajv({
      allErrors: false,
      removeAdditional: true,
      useDefaults: true
    })
    ajv.addKeyword('flatten', {
      valid: true,
      validate: (...args) => {
        this._collectData(...args)
      },
      metaSchema: {
        type: 'object',
        additionalItems: false
      }
    })
    this._dataCollector = ajv.compile(this._jsonSchema)
    this._flattenedData = null
  }

  /**
   * Prepares schema
   */
  _prepareSchema () {
    const schemaFlatter = new SchemaFlatter(
      this._naming.pathSeparator,
      this._naming.generatedFieldPrefix,
      this._naming.placeholder)
    const flattenedSchema = schemaFlatter.flatten(this._jsonSchema, this._collectionName)
    _.forOwn(flattenedSchema, (entity, entityFqName) => {
      const originPath = JsonUtils.pointerToPath(entity.origin)

      // In case additionalProperties rely on default declaration, inject it
      if (originPath.match(/\/additionalProperties$/) && _.get(this._jsonSchema, originPath) === true) {
        _.set(this._jsonSchema, originPath, schemaFlatter.defaultAdditionalPropertiesDeclaration)
      }

      let flattenDeclaration = {
        entity: entityFqName,
        fields: {}
      }
      _.forOwn(entity.fields, (field, name) => {
        flattenDeclaration.fields[name] = !field.reference ? null : {
          depth: field.reference.depth,
          name: field.reference.field
        }
      })
      _.set(this._jsonSchema, originPath ? `${originPath}.flatten` : 'flatten', flattenDeclaration)
    })
  }

  /**
   * Flattens the data
   */
  flatten (data) {
    this._flattenedData = {}
    this._dataCollector(data)
    const flattenedData = this._flattenedData
    this._flattenedData = null
    return flattenedData
  }

  /**
   * Collects data
   *
   * @param {Object} flattenDeclaration Flatten declaration
   * @param {Object} data Data
   * @param {Object} dataSchema Data schema
   * @param {string} dataPath Data path
   * @param {Object} dataObject Data object
   * @param {string} propertyName The property name in the data object
   * @param {Object} rootData The root data
   */
  _collectData (flattenDeclaration, data, dataSchema, dataPath, dataObject, propertyName, rootData) {
    let flattenedObject = {}
    _.forOwn(flattenDeclaration.fields, (reference, name) => {
      if (!reference) {
        flattenedObject[name] = data[name]
      } else {
        const dataPointer = JsonUtils.pathToPointer(dataPath)
        const foreignDataPointer = dataPointer
          .split('/')
          .slice(0, -reference.depth)
          .join('/')
        const foreignDataPath = JsonUtils.pointerToPath(foreignDataPointer)
        const propertyPath = foreignDataPath ? `${foreignDataPath}.${reference.name}` : reference.name
        flattenedObject[name] = _.get(rootData, propertyPath)
      }
    })

    let entityData = this._flattenedData[flattenDeclaration.entity]
    if (!entityData) {
      entityData = this._flattenedData[flattenDeclaration.entity] = []
    }
    entityData.push(flattenedObject)
  }
}

module.exports = DataFlatter
