// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { ConfigMapping } from './configMapping'
import { ConfigDeclaration } from './configDeclaration'
import { Source } from './source'
import { Target } from './target'

export function createSource(
  configDeclaration: {} | ConfigDeclaration,
  outputFactory: any,
) {
  return new Source(configDeclaration, outputFactory)
}

export function createTarget(
  configDeclaration: {} | ConfigDeclaration,
  inputFactory: any,
) {
  return new Target(configDeclaration, inputFactory)
}

export function createConfigDeclaration() {
  return new ConfigDeclaration()
}

export function createConfigMapping() {
  return new ConfigMapping()
}

const config = {
  declare: createConfigDeclaration,
  map: createConfigMapping,
}

export * from './configDeclaration'
export * from './configMapping'
export * from './counter'
export * from './filter'
export * from './jsonUtils'
export * from './mapper'
export * from './stream'
export * from './replicate'
export * from './replicator'
export * from './replicationChainBuilder'
export * from './sequence'
export * from './scanner'
export * from './source'
export * from './target'
export { config, createSource as source, createTarget as target }
