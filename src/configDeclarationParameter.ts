// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

export type ConfigDeclarationParameterType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'

export interface ConfigDeclarationParameter {
  description?: string
  type?: ConfigDeclarationParameterType
  item?: ConfigDeclarationParameterType
  format?: string
  enum?: string[]
  required?: boolean
  conflicts?: string[]
  default?: any
}
