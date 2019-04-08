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
