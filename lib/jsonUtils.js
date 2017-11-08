const _ = require('lodash')
const check = require('check-types')

/**
 * Collection of JSON utilities
 */
class JsonUtils {
  /**
   * Converts JSON Pointer to property path
   */
  static pointerToPath (pointer) {
    check.assert.maybe.string(pointer)

    if (!pointer || pointer.length === 0 || pointer === '#') {
      return ''
    }

    pointer = pointer
      .replace(/^#/, '')
      .replace(/\/([^/]+)/g, '[\'$1\']')
      .replace(/\['(\d+)'\]/g, '[$1]')

    return JsonUtils.unescapeFromPointer(pointer)
  }

  /**
   * Converts property path to JSON Pointer
   */
  static pathToPointer (path) {
    check.assert.maybe.string(path)

    if (!path || path.length === 0) {
      return '#'
    }
    return '#' + JsonUtils.escapeForPointer(path)
      .replace(/\./g, '/')
      .replace(/\[['"]?([^[\]]+?)['"]?\]/g, '/$1')
  }

  /**
   * Gets parent pointer of a specified pointer
   */
  static getParentPointer (pointer) {
    check.assert.maybe.string(pointer)

    if (!pointer || pointer.length === 0 || pointer === '#') {
      return '#'
    }

    return pointer.replace(/\/[^/]+$/g, '')
  }

  /**
   * Resolves JSON reference in specified JSON schema (if needed)
   */
  static resolveReference (reference, jsonSchema) {
    check.assert.string(reference)
    check.assert.object(jsonSchema)

    const propertyPath = JsonUtils.pointerToPath(reference)
    try {
      const jsonDeclaration = _.get(jsonSchema, propertyPath)
      if (!jsonDeclaration) {
        throw new Error(`Failed to resolve $ref "${reference}" as "${propertyPath}"`)
      }
      return jsonDeclaration
    } catch (error) {
      throw new Error(`Failed to resolve $ref "${reference}" as "${propertyPath}": ${error}`)
    }
  }

  /**
   * Escapes string to be safe for JSON Pointer
   *
   * According to https://tools.ietf.org/html/rfc6901,
   * '~' => '~0'
   * '/' => '~1'
   */
  static escapeForPointer (input) {
    check.assert.string(input)

    return input
      .replace(/~/g, '~0')
      .replace(/\//g, '~1')
  }

  /**
   * Unescapes string to be safe for JSON Pointer
   *
   * According to https://tools.ietf.org/html/rfc6901,
   * '~0' => '~'
   * '~1' => '/'
   */
  static unescapeFromPointer (input) {
    check.assert.string(input)

    return input
      .replace(/~0/g, '~')
      .replace(/~1/g, '/')
  }
}

module.exports = JsonUtils
