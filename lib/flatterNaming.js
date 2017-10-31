/**
 * Generates naming
 */
class FlatterNaming {
  /**
   * @constructor
   * @param {string} [pathSeparator=undefined] Path separator
   * @param {string} [generatedFieldPrefix=undefined] Generated field prefix
   * @param {string} [placeholder=undefined] Placeholder
   */
  constructor (pathSeparator, generatedFieldPrefix, placeholder) {
    this._pathSeparator = pathSeparator || FlatterNaming.DEFAULT_PATH_SEPARATOR
    this._generatedFieldPrefix = generatedFieldPrefix || FlatterNaming.DEFAULT_GENERATED_FIELD_PREFIX
    this._placeholder = placeholder || FlatterNaming.DEFAULT_PLACEHOLDER
  }

  get pathSeparator () {
    return this._pathSeparator
  }

  get generatedFieldPrefix () {
    return this._generatedFieldPrefix
  }

  get placeholder () {
    return this._placeholder
  }

  /**
   * Converts JSON Pointer to fully-qualified entity name
   */
  pointerToFqEntityName (pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return ''
    }

    return pointer
      .replace(/\/(\d+)/g, `/${this._placeholder}`)
      .replace(/(^#\/?)|(\/$)/g, '')
      .replace(/\//g, this._pathSeparator)
  }

  /**
   * Gets entity name from specified components
   */
  getEntityFqName (...components) {
    if (!components || components.length === 0) {
      return ''
    }
    if (components.length === 1) {
      return components[0]
    }
    return components.join(this._pathSeparator)
  }

  /**
   * Gets entity name for variadic properties of specified entity
   */
  getVariadicPropertiesEntityFqName (entityFqName, variadicPropertiesIndex = 0) {
    return `${entityFqName}[${this._placeholder}${variadicPropertiesIndex}]`
  }

  /**
   * Gets foreign ID field name for specified property of specified entity (by fully-qualified name)
   */
  getForeignFieldName (entityFqName, propertyName) {
    return `${this._generatedFieldPrefix}foreign${this._generatedFieldPrefix}${propertyName}${this._generatedFieldPrefix}${entityFqName}`
  }

  /**
   * Gets array field name from property name
   */
  getArrayFieldName (propertyName) {
    return `${propertyName}[${this._placeholder}]`
  }

  /**
   * Gets key field name for variadic properties
   */
  getVariadicPropertiesKeyFieldName () {
    return `${this._generatedFieldPrefix}property`
  }

  /**
   * Gets value field name for variadic properties
   */
  getVariadicPropertiesValueFieldName () {
    return `${this._generatedFieldPrefix}value`
  }

  /**
   * Gets value field name for array item
   */
  getArrayItemValueFieldName () {
    return `${this._generatedFieldPrefix}value`
  }
}

FlatterNaming.DEFAULT_PATH_SEPARATOR = '/'
FlatterNaming.DEFAULT_GENERATED_FIELD_PREFIX = '$'
FlatterNaming.DEFAULT_PLACEHOLDER = '@'

module.exports = FlatterNaming
