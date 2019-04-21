// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { JSONSchema6 } from 'json-schema'
import { Source } from './source'
import { Target } from './target'

export interface Collection {
  origin: string
  name: string
  schema: JSONSchema6
  source: Source
  target: Target
}
