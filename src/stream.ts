// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { isObject, isFunction, isBoolean } from 'lodash'

export type Stream = NodeJS.ReadableStream | NodeJS.WritableStream

export type TransformStream = NodeJS.ReadableStream & NodeJS.WritableStream

export function isReadableStream(input: object): boolean {
  return (
    isObject(input) &&
    isBoolean(input['readable']) &&
    isFunction(input['read']) &&
    isFunction(input['pipe']) &&
    isFunction(input['unpipe'])
  )
}

export function isWritableStream(input: object): boolean {
  return (
    isObject(input) &&
    isBoolean(input['writable']) &&
    isFunction(input['write']) &&
    isFunction(input['end'])
  )
}
