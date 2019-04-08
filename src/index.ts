// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import config from './config'
import ConfigDeclaration from './configDeclaration'
import ConfigMapping from './configMapping'
import Counter from './counter'
import Filter from './filter'
import JsonUtils from './jsonUtils'
import Mapper from './mapper'
import replicate from './replicate'
import Replicator from './replicator'
import { ReplicationChainBuilder } from './replicationChainBuilder'
import Sequence from './sequence'
import Scanner from './scanner'
import Source from './source'
import Target from './target'

function source(configDeclaration: {} | ConfigDeclaration, outputFactory: any) {
  return new Source(configDeclaration, outputFactory)
}

function target(configDeclaration: {} | ConfigDeclaration, inputFactory: any) {
  return new Target(configDeclaration, inputFactory)
}

export {
  config,
  ConfigDeclaration,
  ConfigMapping,
  Counter,
  Filter,
  JsonUtils,
  Mapper,
  replicate,
  Replicator,
  ReplicationChainBuilder,
  Sequence,
  Scanner,
  source,
  Source,
  target,
  Target,
}
export const dataplug = {
  config,
  ConfigDeclaration,
  ConfigMapping,
  Counter,
  Filter,
  JsonUtils,
  Mapper,
  replicate,
  Replicator,
  ReplicationChainBuilder,
  Sequence,
  Scanner,
  source,
  Source,
  target,
  Target,
}
export default dataplug
