// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { get } from 'lodash'

/**
 * Converts JSON Pointer to property path
 */
export function pointerToPath(pointer: string) {
  if (!pointer || pointer.length === 0 || pointer === '#') {
    return ''
  }

  pointer = pointer
    .replace(/^#/, '')
    .replace(/\/([^/]+)/g, "['$1']")
    .replace(/\['(\d+)']/g, '[$1]')

  return unescapeFromPointer(pointer)
}

/**
 * Converts property path to JSON Pointer
 */
export function pathToPointer(path: string) {
  if (!path || path.length === 0) {
    return '#'
  }
  return (
    '#' +
    escapeForPointer(path)
      .replace(/\./g, '/')
      .replace(/\[['"]?([^[\]]+?)['"]?\]/g, '/$1')
  )
}

/**
 * Gets parent pointer of a specified pointer
 */
export function getParentPointer(pointer: string) {
  if (!pointer || pointer.length === 0 || pointer === '#') {
    return '#'
  }

  return pointer.replace(/\/[^/]+$/g, '')
}

/**
 * Resolves JSON reference in specified JSON schema (if needed)
 */
export function resolveReference(reference: string, jsonSchema: Object) {
  const propertyPath = pointerToPath(reference)
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
export function escapeForPointer(input: string) {
  return input.replace(/~/g, '~0').replace(/\//g, '~1')
}

/**
 * Unescapes string to be safe for JSON Pointer
 *
 * According to https://tools.ietf.org/html/rfc6901,
 * '~0' => '~'
 * '~1' => '/'
 */
export function unescapeFromPointer(input: string) {
  return input.replace(/~0/g, '~').replace(/~1/g, '/')
}
