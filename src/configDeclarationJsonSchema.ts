// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

export interface ConfigDeclarationJsonSchema {
  type: string
  additionalProperties: boolean
  properties: Object
  required: Array<string>
}
