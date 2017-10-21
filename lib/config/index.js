const ConfigDeclaration = require('./configDeclaration');
const ConfigMapping = require('./configMapping');

function createConfigDeclaration() {
  return new ConfigDeclaration();
}

function createConfigMapping() {
  return new ConfigMapping();
}

module.exports = {
  ConfigDeclaration,
  declare: createConfigDeclaration,
  ConfigMapping,
  map: createConfigMapping
};
