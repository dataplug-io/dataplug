// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

export interface ConfigDeclarationParameter {
  definition: string
  type: string
  item: string
  format: string
  enum: string[]
  required: boolean
  conflicts: string[]
}
