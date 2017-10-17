const ConfigDeclaration = require('./configDeclaration');
const ConfigMapping = require('./configMapping');

module.exports = {
  ConfigDeclaration,
  get declare() {
    return new ConfigDeclaration();
  },
  ConfigMapping,
  get mapping() {
    return new ConfigMapping();
  }
};
