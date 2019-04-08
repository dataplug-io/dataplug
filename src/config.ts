// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import ConfigDeclaration from './configDeclaration'
import ConfigMapping from './configMapping'

function createConfigDeclaration() {
  return new ConfigDeclaration()
}

function createConfigMapping() {
  return new ConfigMapping()
}

export default {
  declare: createConfigDeclaration,
  map: createConfigMapping,
}
