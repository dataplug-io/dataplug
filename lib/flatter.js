const _ = require('lodash');
const Ajv = require('ajv');
const {
  Transform
} = require('stream');

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
  constructor(schema, pathSeparator = '/', generatedFieldPrefix = '$', placeholder = '@') {
    super({
      objectMode: true
    });

    this._schema = this._prepareSchema(schema);

    const dataCollector = new Ajv({
      allErrors: false,
      removeAdditional: true,
      useDefaults: true,
      passContext: true
    });
    dataCollector.addKeyword('flatten', {
      valid: true,
      validate: this._collectFlatterables,
      metaSchema: {
        type: 'boolean',
        additionalItems: false
      }
    });
    this._dataCollector = dataCollector.compile(this._schema);
    this._flatterablesMap = new Map();
    this._flatterables = [];
    this._flatterables = new Map();
    this._pathSeparator = pathSeparator;
    this._generatedFieldPrefix = generatedFieldPrefix;
    this._placeholder = placeholder;
  }

  /**
   * https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback
   * @override
   */
  _transform(chunk, encoding, callback) {
    // Collect flatterables
    this._flatterablesMap.clear();
    this._flatterables = [];
    this._dataCollector.call(this, chunk);

    // Prepare flatterables
    this._prepareFlatterables(this._flatterables, this._flatterablesMap);

    // Flatten collected flatterables
    const flattened = this._flatten(this._flatterables, this._flatterablesMap);
    callback(null, flattened);
  }

  /**
   * Prepares schema
   *
   * Inserts flatten keyword marker in every suitable complex object schema.
   */
  _prepareSchema(schema) {
    schema = _.cloneDeep(schema);
    this._injectFlattenKeyword(schema, undefined, schema)
    return schema;
  }

  /**
   * Inserts 'flatten' keyword in schema if it's type is array or object.
   */
  _injectFlattenKeyword(rootSchema, parentSchema, schema) {
    if (schema.type === 'object') {

      if (schema.properties) {
        for (let propertyName in schema.properties) {
          this._injectFlattenKeyword(rootSchema, schema, schema.properties[propertyName]);
        }
      }
      if (schema.patternProperties) {
        for (let propertyNamePattern in schema.patternProperties) {
          this._injectFlattenKeyword(rootSchema, schema, schema.patternProperties[propertyNamePattern]);
        }
      }
      if (schema.additionalProperties) {
        this._injectFlattenKeyword(rootSchema, schema, schema.additionalProperties);
      }

      schema.flatten = true;

    } else if (schema.type === 'array') {

      if (schema.items) {
        if (_.isArray(schema.items)) {
          throw new Error('Not supported: tuple');
        }
        this._injectFlattenKeyword(rootSchema, schema, schema.items);
      }

      schema.flatten = true;

    } else if (schema.$ref) {

      const ref = schema.$ref;
      const propertyPath = this._pointerToPath(ref);
      try {
        schema = eval(`rootSchema${propertyPath}`);
        if (!schema) {
          throw new Error(`Failed to resolve $ref "${ref}" as "${propertyPath}"`);
        }
      } catch (error) {
        throw new Error(`Failed to resolve $ref "${ref}" as "${propertyPath}"`);
      }

      this._injectFlattenKeyword(rootSchema, parentSchema, schema);
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
  _collectFlatterables(schemaValue, data, dataSchema, dataPath, dataObject, propertyName, rootData) {
    let flatterable = {
      schemaValue,
      data,
      dataSchema,
      dataPath,
      dataObject,
      propertyName,
      rootData
    };

    flatterable.dataPointer = this._pathToPointer(dataPath);

    this._flatterables.push(flatterable);
    this._flatterablesMap.set(flatterable.dataPointer, flatterable);
  }

  /**
   * Prepares flatterables
   *
   * @param {Object[]} flatterables Flatterables array in root-last order
   * @param {Map} flatterablesMap Flatterables map
   */
  _prepareFlatterables(flatterables, flatterablesMap) {
    const flatterablesCount = flatterables.length;

    // Fill in fully-qualified entity names
    for (let i = flatterablesCount - 1; i >= 0; i--) {
      let flatterable = flatterables[i];
      flatterable.fqEntityName = this._pointerToFqEntityName(flatterable.dataPointer);
    }

    // Find all objects with variadic properties
    for (let i = flatterablesCount - 1; i >= 0; i--) {
      let flatterable = flatterables[i];
      if (flatterable.dataSchema.type !== 'object') {
        continue;
      }

      if (flatterable.dataSchema.additionalProperties || flatterable.dataSchema.patternProperties) {
        flatterable.hasVariadicProperties = true;

        // Adjust fully-qualified entity names
        const baseFqEntityNameLen = flatterable.fqEntityName.length + this._pathSeparator.length;
        for (let j = i - 1; j >= 0; j--) {
          let otherFlatterable = flatterables[j];

          if (otherFlatterable.fqEntityName.startsWith(flatterable.fqEntityName + this._pathSeparator)) {

            const tail = otherFlatterable.fqEntityName.slice(baseFqEntityNameLen);
            const newTail = tail.replace(/(^[^\/]+)/, `${this._placeholder}`); //TODO: replace hardcoded / (slice/join?)
            otherFlatterable.fqEntityName = flatterable.fqEntityName + this._pathSeparator + newTail;
          }
        }
      }
    }

    // Fill identifiers
    for (let i = flatterablesCount - 1; i >= 0; i--) {
      let flatterable = flatterables[i];

      flatterable.identifier = this._createIdentifier(flatterable.dataPointer, flatterablesMap);
    }
  }

  /**
   * Flattens the data.
   *
   * @param {Object[]} flatterables Flatterables array in root-last order
   * @param {Map} flatterablesMap Flatterables map
   * @return {Object} Flattened data
   */
  _flatten(flatterables, flatterablesMap) {
    let flattenedData = {};

    let processedFlatterables = flatterables.slice(0);
    for (let flatterableIndex = processedFlatterables.length - 1; flatterableIndex >= 0; flatterableIndex--) {
      let flatterable = processedFlatterables[flatterableIndex];
      if (!flatterable) {
        continue;
      }

      if (flatterable.dataSchema.type === 'array') {
        let flattenedArray = [];

        const itemsCount = flatterable.data.length;
        for (let itemIndex = 0; itemIndex < itemsCount; itemIndex++) {
          const flatterableItem = flatterablesMap.get(flatterable.dataPointer + `/${itemIndex}`)

          const flattenedItem = this._flattenValue(flatterableItem.data);
          flattenedArray.push(Object.assign({},
            flatterableItem.identifier,
            flattenedItem));

          const flatterableItemIndex = processedFlatterables.indexOf(flatterableItem);
          processedFlatterables[flatterableItemIndex] = null;
        }

        flattenedData[flatterable.fqEntityName] = flattenedArray.concat(flattenedData[flatterable.fqEntityName] || []);
      } else if (flatterable.dataSchema.type === 'object' && !!flatterable.hasVariadicProperties) {
        let flattenedObject = [];

        for (let fieldName in flatterable.data) {
          const flatterableItem = flatterablesMap.get(flatterable.dataPointer + `/${fieldName}`)

          const flattenedItem = this._flattenValue(flatterableItem.data);
          flattenedObject.push(Object.assign({},
            flatterableItem.identifier,
            flattenedItem));

          const flatterableItemIndex = processedFlatterables.indexOf(flatterableItem);
          processedFlatterables[flatterableItemIndex] = null;
        }

        flattenedData[flatterable.fqEntityName] = flattenedObject.concat(flattenedData[flatterable.fqEntityName] || []);
      } else if (flatterable.dataSchema.type === 'object' && !flatterable.hasVariadicProperties) {
        const flattenedItem = this._flattenValue(flatterable.data);
        const flattenedObject = Object.assign({},
          flatterable.identifier,
          flattenedItem);

        processedFlatterables[flatterableIndex] = null;

        flattenedData[flatterable.fqEntityName] = [flattenedObject].concat(flattenedData[flatterable.fqEntityName] || []);
      }
    }

    return flattenedData;
  }

  /**
   * Converts property path to JSON Pointer
   */
  _pathToPointer(path) {
    if (!path || path.length === 0) {
      return '#';
    }
    return '#' + path
      .replace(/\./g, '/')
      .replace(/\[[\'\"]?([^\[\]]+?)[\'\"]?\]/g, '/$1');
  }

  /**
   * Converts JSON Pointer to property path
   */
  _pointerToPath(pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return '';
    }

    return pointer
      .replace(/^#/, '')
      .replace(/\/([^\/]+)/g, '[\'$1\']')
      .replace(/\[\'(\d+)\'\]/g, '[$1]');
  }

  /**
   * Converts JSON Pointer to fully-qualified entity name
   */
  _pointerToFqEntityName(pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return '';
    }

    return pointer
      .replace(/\/(\d+)/g, '/' + this._placeholder)
      .replace(/(^#\/?)|(\/$)/g, '')
      .replace(/\//g, this._pathSeparator);
  }

  /**
   * Gets parent pointer of a specified pointer
   */
  _getParentPointer(pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return '#';
    }

    return pointer.replace(/\/[^\/]+$/g, '');
  }

  /**
   * Gets foreign key property for given fully-qualified entity name
   */
  _getForeignKeyProperty(fqEntityName, key) {
    return `${this._generatedFieldPrefix}FK:${key}${this._generatedFieldPrefix}${fqEntityName}`;
  }

  /**
   * Creates identifier for pointer, that is suitable for use as primary key
   */
  _createIdentifier(pointer, flatterablesMap) {
    let identifier = {};

    let hierarchy = [];
    let flatterable;
    let resolvePointer = pointer;
    do {
      flatterable = flatterablesMap.get(resolvePointer);
      hierarchy.push(flatterable);
      resolvePointer = this._getParentPointer(resolvePointer);
    } while (flatterable.dataPointer !== resolvePointer);

    let parentFlatterable = null;
    for (let i = hierarchy.length - 1; i >= 0; i--) {
      const theObject = (i === 0);
      flatterable = hierarchy[i];

      if (flatterable.dataSchema.required && flatterable.dataSchema.required.length > 0) {
        if (!theObject) {
          for (let j = flatterable.dataSchema.required.length - 1; j >= 0; j--) {
            let requiredKey = flatterable.dataSchema.required[j];
            identifier[this._getForeignKeyProperty(flatterable.fqEntityName, requiredKey)] = flatterable.data[requiredKey];
          }
        }
      } else if (parentFlatterable && parentFlatterable.dataSchema.type === 'array' && theObject) {
        // There's no need to identify by index in array, that's just a one-to-many relation,
        // yet there's need to identify intermediate array object
      } else if (parentFlatterable && parentFlatterable.dataSchema.type === 'object' && !!parentFlatterable.hasVariadicProperties) {
        identifier[this._getForeignKeyProperty(flatterable.fqEntityName, 'field')] = flatterable.propertyName;
      } else if (flatterable.dataSchema.type === 'array' || (flatterable.dataSchema.type === 'object' && !!flatterable.hasVariadicProperties)) {
        // No need to identify arrays and variadic objects
      } else {
        throw new Error(`Unable to create identifier for "${pointer}" due to "${flatterable.fqEntityName}"`);
      }

      parentFlatterable = flatterable;
    }

    return identifier;
  }

  /**
   * Flattens the input value
   *
   * @param {Object} input Value to be flattened
   * @return {Object} Flattened object
   */
  _flattenValue(input) {
    let flattenedObject = {};

    if (_.isObject(input)) {
      for (let key in input) {
        const value = input[key];
        if (_.isObject(value)) {
          continue;
        }

        flattenedObject[key] = value;
      }
    } else {
      flattenedObject[`${this._generatedFieldPrefix}value`] = value;
    }

    return flattenedObject;
  }
}

module.exports = Flatter;
