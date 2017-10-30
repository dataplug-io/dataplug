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
   * @param {string} [collectionName=''] Collection name
   * @param {string} [pathSeparator=undefined] Path separator
   * @param {string} [generatedFieldPrefix=undefined] Generated field prefix
   * @param {string} [placeholder=undefined] Placeholder
   */
  constructor (jsonSchema, collectionName = '', pathSeparator = undefined, generatedFieldPrefix = undefined, placeholder = undefined) {
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

  //
  //   /**
  //    * Collects flatterables
  //    *
  //    * @param {Object} flattenMode Flatten mode
  //    * @param {Object} data Data
  //    * @param {Object} dataSchema Data schema
  //    * @param {string} dataPath Data path
  //    * @param {Object} dataObject Data object
  //    * @param {string} propertyName The property name in the data object
  //    * @param {Object} rootData The root data
  //    */
  // _collectFlatterables (schemaValue, data, dataSchema, dataPath, dataObject, propertyName, rootData) {
  //   let flatterable = {
  //     schemaValue,
  //     data,
  //     dataSchema,
  //     dataPath,
  //     dataObject,
  //     propertyName,
  //     rootData
  //   }
  //
  //   flatterable.dataPointer = JsonUtils.pathToPointer(dataPath)
  //
  //   this._flatterables.push(flatterable)
  //   this._flatterablesMap.set(flatterable.dataPointer, flatterable)
  // }
  //
  //   /**
  //    * Prepares flatterables
  //    *
  //    * @param {Object[]} flatterables Flatterables array in root-last order
  //    * @param {Map} flatterablesMap Flatterables map
  //    */
  // _prepareFlatterables (flatterables, flatterablesMap) {
  //   const flatterablesCount = flatterables.length
  //
  //     // Fill in fully-qualified entity names
  //   for (let i = flatterablesCount - 1; i >= 0; i--) {
  //     let flatterable = flatterables[i]
  //     flatterable.fqEntityName = this._naming.pointerToFqEntityName(flatterable.dataPointer)
  //   }
  //
  //     // Find all objects with variadic properties
  //   for (let i = flatterablesCount - 1; i >= 0; i--) {
  //     let flatterable = flatterables[i]
  //     if (flatterable.dataSchema.type !== 'object') {
  //       continue
  //     }
  //
  //     if (flatterable.dataSchema.additionalProperties || flatterable.dataSchema.patternProperties) {
  //       flatterable.hasVariadicProperties = true
  //
  //       if (flatterable.dataSchema.required && flatterable.dataSchema.required.length > 0) {
  //         throw new Error('Not supported: objects with variadic properties can not have "required" properties')
  //       }
  //
  //         // Adjust fully-qualified entity names
  //       const baseFqEntityNameLen = flatterable.fqEntityName.length + this._pathSeparator.length
  //       for (let j = i - 1; j >= 0; j--) {
  //         let otherFlatterable = flatterables[j]
  //
  //         if (otherFlatterable.fqEntityName.startsWith(flatterable.fqEntityName + this._pathSeparator)) {
  //           const tail = otherFlatterable.fqEntityName.slice(baseFqEntityNameLen)
  //           const newTail = tail.replace(/(^[^/]+)/, `${this._placeholder}`) // TODO: replace hardcoded / (slice/join?)
  //           otherFlatterable.fqEntityName = flatterable.fqEntityName + this._pathSeparator + newTail
  //         }
  //       }
  //     }
  //   }
  //
  //     // Identify flatterables
  //   for (let i = flatterablesCount - 1; i >= 0; i--) {
  //     let flatterable = flatterables[i]
  //
  //     this._identify(flatterable, flatterablesMap)
  //   }
  // }
  //
  //   /**
  //    * Flattens the data.
  //    *
  //    * @param {Object[]} flatterables Flatterables array in root-last order
  //    * @param {Map} flatterablesMap Flatterables map
  //    * @return {Object} Flattened data
  //    */
  // _flatten (flatterables, flatterablesMap) {
  //   let flattenedData = {}
  //
  //   let processedFlatterables = flatterables.slice(0)
  //   for (let flatterableIndex = processedFlatterables.length - 1; flatterableIndex >= 0; flatterableIndex--) {
  //     let flatterable = processedFlatterables[flatterableIndex]
  //     if (!flatterable) {
  //       continue
  //     }
  //
  //     if (flatterable.dataSchema.type === 'array') {
  //       let flattenedArray = []
  //
  //       const itemsCount = flatterable.data.length
  //       const arrayOfScalars = itemsCount > 0 && !flatterablesMap.get(`${flatterable.dataPointer}/0`)
  //       if (arrayOfScalars) {
  //         for (let itemIndex = 0; itemIndex < itemsCount; itemIndex++) {
  //           const flattenedItem = this._flattenValue(flatterable.data[itemIndex])
  //           flattenedArray.push(Object.assign({},
  //               flattenedItem))
  //         }
  //       } else {
  //         for (let itemIndex = 0; itemIndex < itemsCount; itemIndex++) {
  //           const flatterableItem = flatterablesMap.get(`${flatterable.dataPointer}/${itemIndex}`)
  //
  //           const flattenedItem = this._flattenValue(flatterableItem.data)
  //           flattenedArray.push(Object.assign({},
  //               flatterableItem.selfIdentifier,
  //               flattenedItem))
  //
  //           const flatterableItemIndex = processedFlatterables.indexOf(flatterableItem)
  //           processedFlatterables[flatterableItemIndex] = null
  //         }
  //       }
  //
  //       processedFlatterables[flatterableIndex] = null
  //
  //       flattenedData[flatterable.fqEntityName] = flattenedArray.concat(flattenedData[flatterable.fqEntityName] || [])
  //     } else if (flatterable.dataSchema.type === 'object' && !!flatterable.hasVariadicProperties) {
  //       let flattenedObject = []
  //
  //       for (let fieldName in flatterable.data) {
  //         const flatterableItem = flatterablesMap.get(`${flatterable.dataPointer}/${fieldName}`)
  //
  //         const flattenedItem = this._flattenValue(flatterableItem.data)
  //         flattenedObject.push(Object.assign({},
  //             flatterableItem.selfIdentifier,
  //             flattenedItem))
  //
  //         const flatterableItemIndex = processedFlatterables.indexOf(flatterableItem)
  //         processedFlatterables[flatterableItemIndex] = null
  //       }
  //
  //       processedFlatterables[flatterableIndex] = null
  //
  //       flattenedData[flatterable.fqEntityName] = flattenedObject.concat(flattenedData[flatterable.fqEntityName] || [])
  //     } else if (flatterable.dataSchema.type === 'object' && !flatterable.hasVariadicProperties) {
  //       const flattenedItem = this._flattenValue(flatterable.data)
  //       const flattenedObject = Object.assign({},
  //           flatterable.selfIdentifier,
  //           flattenedItem)
  //
  //       processedFlatterables[flatterableIndex] = null
  //
  //       flattenedData[flatterable.fqEntityName] = [flattenedObject].concat(flattenedData[flatterable.fqEntityName] || [])
  //     }
  //   }
  //
  //   assert(processedFlatterables.every((x) => x === null), 'Not all flatterables were processed')
  //
  //   return flattenedData
  // }
  //
  //   /**
  //    * Gets key property for given fully-qualified entity name
  //    */
  // _getKeyProperty (fqEntityName, key) {
  //   return `${this._generatedFieldPrefix}K:${key}${this._generatedFieldPrefix}${fqEntityName}`
  // }
  //
  //   /**
  //    * Identifiers specified flatterable
  //    *
  //    * @param {Object} theFlatterable Flatterable to identify
  //    * @param {Map} flatterablesMap Map of all flatterables, by JSON pointers
  //    */
  // _identify (theFlatterable, flatterablesMap) {
  //     // Uwrap the hierarchy of ownership, root-last order
  //   let hierarchy = []
  //   let rootFlatterable
  //   let pointer = theFlatterable.dataPointer
  //   do {
  //     hierarchy.push(rootFlatterable = flatterablesMap.get(pointer))
  //     pointer = JsonUtils.getParentPointer(pointer)
  //   } while (rootFlatterable.dataPointer !== pointer)
  //
  //     // Form the selfIdentifier and identifier
  //   let parentFlatterable = null
  //   for (let i = hierarchy.length - 1; i >= 0; i--) {
  //     let flatterable = hierarchy[i]
  //
  //       // If this flatterable already identified, proceed to next one
  //     if (flatterable.identifier && flatterable.selfIdentifier) {
  //       parentFlatterable = flatterable
  //       continue
  //     }
  //
  //       // If there's a parent flatterable, clone it's identifier
  //     if (parentFlatterable) {
  //       flatterable.identifier = _.clone(parentFlatterable.identifier)
  //       flatterable.selfIdentifier = _.clone(parentFlatterable.identifier)
  //     } else {
  //       flatterable.identifier = {}
  //       flatterable.selfIdentifier = {}
  //     }
  //
  //       // Collect own identification
  //     let identifier = {}
  //     let selfIdentifier = {}
  //     if (flatterable.dataSchema.required && flatterable.dataSchema.required.length > 0) {
  //         // Always collect required keys as part of identifier
  //       for (let j = flatterable.dataSchema.required.length - 1; j >= 0; j--) {
  //         const requiredKey = flatterable.dataSchema.required[j]
  //
  //         const identifierProperty = this._naming.getForeignFieldName(flatterable.fqEntityName, requiredKey)
  //         identifier[identifierProperty] = selfIdentifier[requiredKey] = flatterable.data[requiredKey]
  //       }
  //     }
  //     if (parentFlatterable && parentFlatterable.dataSchema.type === 'object' && !!parentFlatterable.hasVariadicProperties) {
  //         // If parent is variadic-object, add propertyName as part of identifier
  //       const identifierProperty = this._naming.getForeignFieldName(flatterable.fqEntityName, 'field')
  //       const selfIdentifierProperty = this._getKeyProperty(flatterable.fqEntityName, 'field')
  //       identifier[identifierProperty] = selfIdentifier[selfIdentifierProperty] = flatterable.propertyName
  //     }
  //
  //     if (_.keys(identifier).length === 0 || _.keys(selfIdentifier).length === 0) {
  //       let optional = false
  //
  //         // There's no need to identify array or variadic-object
  //       optional = optional || (flatterable.dataSchema.type === 'array')
  //       optional = optional || (flatterable.dataSchema.type === 'object' && !!flatterable.hasVariadicProperties)
  //
  //         // There's no need to identify the flatterable, if it's element of the array
  //       optional = optional || (flatterable === theFlatterable && parentFlatterable && parentFlatterable.dataSchema.type === 'array')
  //
  //         // There's no need to identify flatterable if it has one-to-one relation with parent
  //       optional = optional || (parentFlatterable && parentFlatterable.dataSchema.type === 'object' && !parentFlatterable.hasVariadicProperties)
  //
  //       if (!optional) {
  //         throw new Error(`Unable to create identifier for "${theFlatterable.dataPointer}" due to "${flatterable.fqEntityName}"`)
  //       }
  //     }
  //
  //     Object.assign(flatterable.identifier, identifier)
  //     Object.assign(flatterable.selfIdentifier, selfIdentifier)
  //
  //     parentFlatterable = flatterable
  //   }
  // }
  //
  //   /**
  //    * Flattens the input value
  //    *
  //    * @param {Object} input Value to be flattened
  //    * @return {Object} Flattened object
  //    */
  // _flattenValue (input) {
  //   let flattenedObject = {}
  //
  //   if (_.isObject(input)) {
  //     for (let key in input) {
  //       const value = input[key]
  //       if (_.isObject(value)) {
  //         continue
  //       }
  //
  //       flattenedObject[key] = value
  //     }
  //   } else {
  //     flattenedObject[`${this._generatedFieldPrefix}value`] = input
  //   }
  //
  //   return flattenedObject
  // }
}

module.exports = DataFlatter
