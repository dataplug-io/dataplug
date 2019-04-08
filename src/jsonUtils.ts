// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { get } from 'lodash'

/**
 * Collection of JSON utilities
 */
export default class JsonUtils {
  /**
   * Converts JSON Pointer to property path
   */
  static pointerToPath(pointer: string) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return ''
    }

    pointer = pointer
      .replace(/^#/, '')
      .replace(/\/([^/]+)/g, "['$1']")
      .replace(/\['(\d+)']/g, '[$1]')

    return JsonUtils.unescapeFromPointer(pointer)
  }

  /**
   * Converts property path to JSON Pointer
   */
  static pathToPointer(path: string) {
    if (!path || path.length === 0) {
      return '#'
    }
    return (
      '#' +
      JsonUtils.escapeForPointer(path)
        .replace(/\./g, '/')
        .replace(/\[['"]?([^[\]]+?)['"]?\]/g, '/$1')
    )
  }

  /**
   * Gets parent pointer of a specified pointer
   */
  static getParentPointer(pointer: string) {
    if (!pointer || pointer.length === 0 || pointer === '#') {
      return '#'
    }

    return pointer.replace(/\/[^/]+$/g, '')
  }

  /**
   * Resolves JSON reference in specified JSON schema (if needed)
   */
  static resolveReference(reference: string, jsonSchema: Object) {
    const propertyPath = JsonUtils.pointerToPath(reference)
    if (propertyPath === '') {
      return jsonSchema
    }
    try {
      const jsonDeclaration = get(jsonSchema, propertyPath)
      if (!jsonDeclaration) {
        throw new Error(
          `Failed to resolve $ref "${reference}" as "${propertyPath}"`,
        )
      }
      return jsonDeclaration
    } catch (error) {
      throw new Error(
        `Failed to resolve $ref "${reference}" as "${propertyPath}": ${error}`,
      )
    }
  }

  /**
   * Escapes string to be safe for JSON Pointer
   *
   * According to https://tools.ietf.org/html/rfc6901,
   * '~' => '~0'
   * '/' => '~1'
   */
  static escapeForPointer(input: string) {
    return input.replace(/~/g, '~0').replace(/\//g, '~1')
  }

  /**
   * Unescapes string to be safe for JSON Pointer
   *
   * According to https://tools.ietf.org/html/rfc6901,
   * '~0' => '~'
   * '~1' => '/'
   */
  static unescapeFromPointer(input: string) {
    return input.replace(/~0/g, '~').replace(/~1/g, '/')
  }
}
