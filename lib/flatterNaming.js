/**
 * Generates naming
 */
class FlatterNaming {
  /**
   * @constructor
   * @param {string} [pathSeparator=undefined] Path separator
   * @param {string} [generatedFieldPrefix=undefined] Generated field prefix
   * @param {string} [placeholder=undefined] Placeholder
   * @param {string} [scopeSpecifier=undefined] Scope specifier
   */
  constructor (pathSeparator = undefined, generatedFieldPrefix = undefined, placeholder = undefined, scopeSpecifier = undefined) {
    this._pathSeparator = pathSeparator || FlatterNaming.DEFAULT_PATH_SEPARATOR
    this._generatedFieldPrefix = generatedFieldPrefix || FlatterNaming.DEFAULT_GENERATED_FIELD_PREFIX
    this._placeholder = placeholder || FlatterNaming.DEFAULT_PLACEHOLDER
    this._scopeSpecifier = scopeSpecifier || FlatterNaming.DEFAULT_SCOPE_SPECIFIER
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

  get scopeSpecifier () {
    return this._scopeSpecifier
  }

  /**
   * Converts JSON Pointer to entity name
   */
  pointerToEntityName (pointer) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return ''
    }

    pointer = pointer
      .replace(/(^#\/?)|(\/$)/g, '')
    let components = pointer
      .split('/')
    let entityNameIndex
    for (let i = components.length - 1; i >= 0; i--) {
      const component = components[i]
      if (component.match(/^\d+$/)) {
        components[i] = this._placeholder
        continue
      }

      entityNameIndex = i
      break
    }

    const entityName = components
      .slice(entityNameIndex)
      .join(this._pathSeparator)

    return entityName
  }

  /**
   * Converts JSON Pointer to fully-qualified entity name
   */
  pointerToEntityFqName (pointer) {
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
   *
   * @param {string} entityName Name of entity owning the property
   * @param {string} propertyName Name of property
   */
  getForeignFieldName (entityName, propertyName) {
    return `${this._generatedFieldPrefix}${entityName}${this._scopeSpecifier}${propertyName}`
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
FlatterNaming.DEFAULT_SCOPE_SPECIFIER = '~'

module.exports = FlatterNaming
