const ConfigDeclaration = require('./configDeclaration')
const ConfigMapping = require('./configMapping')

function createConfigDeclaration () {
  return new ConfigDeclaration()
}

function createConfigMapping () {
  return new ConfigMapping()
}

module.exports = {
  declare: createConfigDeclaration,
  map: createConfigMapping
}
