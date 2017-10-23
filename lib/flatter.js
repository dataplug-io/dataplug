const _ = require('lodash')
const Ajv = require('ajv')
const assert = require('assert')
const {
  Transform
} = require('stream')

/**
 * Flattens the object stream
 */
class Flatter extends Transform {
  /**
   * @constructor
   *
   * @param {Object} schema JSON schema
   * @param {string} [pathSeparator='/'] Path separator
   * @param {string} [generatedFieldPrefix='$'] Generated field prefix
   * @param {string} [placeholder='@'] Placeholder
   */
  constructor (schema, pathSeparator = '/', generatedFieldPrefix = '$', placeholder = '@') {
    super({
      objectMode: true
    })

    this._schema = this._prepareSchema(schema)

    const dataCollector = new Ajv({
      allErrors: false,
      removeAdditional: true,
      useDefaults: true,
      passContext: true
    })
    dataCollector.addKeyword('flatten', {
      valid: true,
      validate: this._collectFlatterables,
      metaSchema: {
        type: 'boolean',
        additionalItems: false
      }
    })
    this._dataCollector = dataCollector.compile(this._schema)
    this._flatterablesMap = new Map()
    this._flatterables = []
    this._flatterables = new Map()
    this._pathSeparator = pathSeparator
    this._generatedFieldPrefix = generatedFieldPrefix
    this._placeholder = placeholder
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform (chunk, encoding, callback) {
    // Collect flatterables
    this._flatterablesMap.clear()
    this._flatterables = []
    this._dataCollector.call(this, chunk)

    // Prepare flatterables
    this._prepareFlatterables(this._flatterables, this._flatterablesMap)

    // Flatten collected flatterables
    try {
      const flattened = this._flatten(this._flatterables, this._flatterablesMap)
      callback(null, flattened)
    } catch (error) {
      console.error('Failed to flatten the flatterables', error)
      callback(error, null)
    }
  }

  /**
   * Prepares schema
   *
   * Inserts flatten keyword marker in every suitable complex object schema.
   */
  _prepareSchema (schema) {
    schema = _.cloneDeep(schema)
    this._injectFlattenKeyword(schema, undefined, schema)
    return schema
  }

  /**
   * Inserts 'flatten' keyword in schema if it's type is array or object.
   */
  _injectFlattenKeyword (rootSchema, parentSchema, schema) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (let propertyName in schema.properties) {
          this._injectFlattenKeyword(rootSchema, schema, schema.properties[propertyName])
        }
      }
      if (schema.patternProperties) {
        for (let propertyNamePattern in schema.patternProperties) {
          this._injectFlattenKeyword(rootSchema, schema, schema.patternProperties[propertyNamePattern])
        }
      }
      if (schema.additionalProperties) {
        this._injectFlattenKeyword(rootSchema, schema, schema.additionalProperties)
      }

      schema.flatten = true
    } else if (schema.type === 'array') {
      if (schema.items) {
        if (_.isArray(schema.items)) {
          throw new Error('Not supported: tuple')
        }
        this._injectFlattenKeyword(rootSchema, schema, schema.items)
      }

      schema.flatten = true
    } else if (schema.$ref) {
      const ref = schema.$ref
      const propertyPath = this._pointerToPath(ref)
      try {
        schema = eval(`rootSchema${propertyPath}`)
        if (!schema) {
          throw new Error(`Failed to resolve $ref "${ref}" as "${propertyPath}"`)
        }
      } catch (error) {
        throw new Error(`Failed to resolve $ref "${ref}" as "${propertyPath}"`)
      }

      this._injectFlattenKeyword(rootSchema, parentSchema, schema)
    }
  }

  /**
   * Collects flatterables
   *
   * @param {Object} flattenMode Flatten mode
   * @param {Object} data Data
   * @param {Object} dataSchema Data schema
   * @param {string} dataPath Data path
   * @param {Object} dataObject Data object
   * @param {string} propertyName The property name in the data object
   * @param {Object} rootData The root data
   */
  _collectFlatterables (schemaValue, data, dataSchema, dataPath, dataObject, propertyName, rootData) {
    let flatterable = {
      schemaValue,
      data,
      dataSchema,
      dataPath,
      dataObject,
      propertyName,
      rootData
    }

    flatterable.dataPointer = this._pathToPointer(dataPath)

    this._flatterables.push(flatterable)
    this._flatterablesMap.set(flatterable.dataPointer, flatterable)
  }

  /**
   * Prepares flatterables
   *
   * @param {Object[]} flatterables Flatterables array in root-last order
   * @param {Map} flatterablesMap Flatterables map
   */
  _prepareFlatterables (flatterables, flatterablesMap) {
    const flatterablesCount = flatterables.length

    // Fill in fully-qualified entity names
    for (let i = flatterablesCount - 1; i >= 0; i--) {
      let flatterable = flatterables[i]
      flatterable.fqEntityName = this._pointerToFqEntityName(flatterable.dataPointer)
    }

    // Find all objects with variadic properties
    for (let i = flatterablesCount - 1; i >= 0; i--) {
      let flatterable = flatterables[i]
      if (flatterable.dataSchema.type !== 'object') {
        continue
      }

      if (flatterable.dataSchema.additionalProperties || flatterable.dataSchema.patternProperties) {
        flatterable.hasVariadicProperties = true

        if (flatterable.dataSchema.required && flatterable.dataSchema.required.length > 0) {
          throw new Error('Not supported: objects with variadic properties can not have "required" properties')
        }

        // Adjust fully-qualified entity names
        const baseFqEntityNameLen = flatterable.fqEntityName.length + this._pathSeparator.length
        for (let j = i - 1; j >= 0; j--) {
          let otherFlatterable = flatterables[j]

          if (otherFlatterable.fqEntityName.startsWith(flatterable.fqEntityName + this._pathSeparator)) {
            const tail = otherFlatterable.fqEntityName.slice(baseFqEntityNameLen)
            const newTail = tail.replace(/(^[^\/]+)/, `${this._placeholder}`) // TODO: replace hardcoded / (slice/join?)
            otherFlatterable.fqEntityName = flatterable.fqEntityName + this._pathSeparator + newTail
          }
        }
      }
    }

    // Identify flatterables
    for (let i = flatterablesCount - 1; i >= 0; i--) {
      let flatterable = flatterables[i]

      this._identify(flatterable, flatterablesMap)
    }
  }

  /**
   * Flattens the data.
   *
   * @param {Object[]} flatterables Flatterables array in root-last order
   * @param {Map} flatterablesMap Flatterables map
   * @return {Object} Flattened data
   */
  _flatten (flatterables, flatterablesMap) {
    let flattenedData = {}

    let processedFlatterables = flatterables.slice(0)
    for (let flatterableIndex = processedFlatterables.length - 1; flatterableIndex >= 0; flatterableIndex--) {
      let flatterable = processedFlatterables[flatterableIndex]
      if (!flatterable) {
        continue
      }

      if (flatterable.dataSchema.type === 'array') {
        let flattenedArray = []

        const itemsCount = flatterable.data.length
        const arrayOfScalars = itemsCount > 0 && !flatterablesMap.get(`${flatterable.dataPointer}/0`)
        if (arrayOfScalars) {
          for (let itemIndex = 0; itemIndex < itemsCount; itemIndex++) {
            const flattenedItem = this._flattenValue(flatterable.data[itemIndex])
            flattenedArray.push(Object.assign({},
              flattenedItem))
          }
        } else {
          for (let itemIndex = 0; itemIndex < itemsCount; itemIndex++) {
            const flatterableItem = flatterablesMap.get(`${flatterable.dataPointer}/${itemIndex}`)

            const flattenedItem = this._flattenValue(flatterableItem.data)
            flattenedArray.push(Object.assign({},
              flatterableItem.selfIdentifier,
              flattenedItem))

            const flatterableItemIndex = processedFlatterables.indexOf(flatterableItem)
            processedFlatterables[flatterableItemIndex] = null
          }
        }

        processedFlatterables[flatterableIndex] = null

        flattenedData[flatterable.fqEntityName] = flattenedArray.concat(flattenedData[flatterable.fqEntityName] || [])
      } else if (flatterable.dataSchema.type === 'object' && !!flatterable.hasVariadicProperties) {
        let flattenedObject = []

        for (let fieldName in flatterable.data) {
          const flatterableItem = flatterablesMap.get(`${flatterable.dataPointer}/${fieldName}`)

          const flattenedItem = this._flattenValue(flatterableItem.data)
          flattenedObject.push(Object.assign({},
            flatterableItem.selfIdentifier,
            flattenedItem))

          const flatterableItemIndex = processedFlatterables.indexOf(flatterableItem)
          processedFlatterables[flatterableItemIndex] = null
        }

        processedFlatterables[flatterableIndex] = null

        flattenedData[flatterable.fqEntityName] = flattenedObject.concat(flattenedData[flatterable.fqEntityName] || [])
      } else if (flatterable.dataSchema.type === 'object' && !flatterable.hasVariadicProperties) {
        const flattenedItem = this._flattenValue(flatterable.data)
        const flattenedObject = Object.assign({},
          flatterable.selfIdentifier,
          flattenedItem)

        processedFlatterables[flatterableIndex] = null

        flattenedData[flatterable.fqEntityName] = [flattenedObject].concat(flattenedData[flatterable.fqEntityName] || [])
      }
    }

    assert(processedFlatterables.every((x) => x === null), 'Not all flatterables were processed')

    return flattenedData
  }

  /**
   * Converts property path to JSON Pointer
   */
  _pathToPointer (path) {
    if (!path || path.length === 0) {
      return '#'
    }
    return '#' + path
      .replace(/\./g, '/')
      .replace(/\[[\'\"]?([^\[\]]+?)[\'\"]?\]/g, '/$1')
  }

  /**
   * Converts JSON Pointer to property path
   */
  _pointerToPath (pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return ''
    }

    return pointer
      .replace(/^#/, '')
      .replace(/\/([^\/]+)/g, '[\'$1\']')
      .replace(/\[\'(\d+)\'\]/g, '[$1]')
  }

  /**
   * Converts JSON Pointer to fully-qualified entity name
   */
  _pointerToFqEntityName (pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return ''
    }

    return pointer
      .replace(/\/(\d+)/g, '/' + this._placeholder)
      .replace(/(^#\/?)|(\/$)/g, '')
      .replace(/\//g, this._pathSeparator)
  }

  /**
   * Gets parent pointer of a specified pointer
   */
  _getParentPointer (pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return '#'
    }

    return pointer.replace(/\/[^\/]+$/g, '')
  }

  /**
   * Gets foreign key property for given fully-qualified entity name
   */
  _getForeignKeyProperty (fqEntityName, key) {
    return `${this._generatedFieldPrefix}FK:${key}${this._generatedFieldPrefix}${fqEntityName}`
  }

  /**
   * Gets key property for given fully-qualified entity name
   */
  _getKeyProperty (fqEntityName, key) {
    return `${this._generatedFieldPrefix}K:${key}${this._generatedFieldPrefix}${fqEntityName}`
  }

  /**
   * Identifiers specified flatterable
   *
   * @param {Object} theFlatterable Flatterable to identify
   * @param {Map} flatterablesMap Map of all flatterables, by JSON pointers
   */
  _identify (theFlatterable, flatterablesMap) {
    // Uwrap the hierarchy of ownership, root-last order
    let hierarchy = []
    let rootFlatterable
    let pointer = theFlatterable.dataPointer
    do {
      hierarchy.push(rootFlatterable = flatterablesMap.get(pointer))
      pointer = this._getParentPointer(pointer)
    } while (rootFlatterable.dataPointer !== pointer)

    // Form the selfIdentifier and identifier
    let parentFlatterable = null
    for (let i = hierarchy.length - 1; i >= 0; i--) {
      let flatterable = hierarchy[i]

      // If this flatterable already identified, proceed to next one
      if (flatterable.identifier && flatterable.selfIdentifier) {
        parentFlatterable = flatterable
        continue
      }

      // If there's a parent flatterable, clone it's identifier
      if (parentFlatterable) {
        flatterable.identifier = _.clone(parentFlatterable.identifier)
        flatterable.selfIdentifier = _.clone(parentFlatterable.identifier)
      } else {
        flatterable.identifier = {}
        flatterable.selfIdentifier = {}
      }

      // Collect own identification
      let identifier = {}
      let selfIdentifier = {}
      if (flatterable.dataSchema.required && flatterable.dataSchema.required.length > 0) {
        // Always collect required keys as part of identifier
        for (let j = flatterable.dataSchema.required.length - 1; j >= 0; j--) {
          const requiredKey = flatterable.dataSchema.required[j]

          const identifierProperty = this._getForeignKeyProperty(flatterable.fqEntityName, requiredKey)
          identifier[identifierProperty] = selfIdentifier[requiredKey] = flatterable.data[requiredKey]
        }
      }
      if (parentFlatterable && parentFlatterable.dataSchema.type === 'object' && !!parentFlatterable.hasVariadicProperties) {
        // If parent is variadic-object, add propertyName as part of identifier
        const identifierProperty = this._getForeignKeyProperty(flatterable.fqEntityName, 'field')
        const selfIdentifierProperty = this._getKeyProperty(flatterable.fqEntityName, 'field')
        identifier[identifierProperty] = selfIdentifier[selfIdentifierProperty] = flatterable.propertyName
      }

      if (_.keys(identifier).length === 0 || _.keys(selfIdentifier).length === 0) {
        let optional = false

        // There's no need to identify array or variadic-object
        optional = optional || (flatterable.dataSchema.type === 'array')
        optional = optional || (flatterable.dataSchema.type === 'object' && !!flatterable.hasVariadicProperties)

        // There's no need to identify the flatterable, if it's element of the array
        optional = optional || (flatterable === theFlatterable && parentFlatterable && parentFlatterable.dataSchema.type === 'array')

        // There's no need to identify flatterable if it has one-to-one relation with parent
        optional = optional || (parentFlatterable && parentFlatterable.dataSchema.type === 'object' && !parentFlatterable.hasVariadicProperties)

        if (!optional) {
          throw new Error(`Unable to create identifier for "${theFlatterable.dataPointer}" due to "${flatterable.fqEntityName}"`)
        }
      }

      Object.assign(flatterable.identifier, identifier)
      Object.assign(flatterable.selfIdentifier, selfIdentifier)

      parentFlatterable = flatterable
    }
  }

  /**
   * Flattens the input value
   *
   * @param {Object} input Value to be flattened
   * @return {Object} Flattened object
   */
  _flattenValue (input) {
    let flattenedObject = {}

    if (_.isObject(input)) {
      for (let key in input) {
        const value = input[key]
        if (_.isObject(value)) {
          continue
        }

        flattenedObject[key] = value
      }
    } else {
      flattenedObject[`${this._generatedFieldPrefix}value`] = input
    }

    return flattenedObject
  }
}

module.exports = Flatter
