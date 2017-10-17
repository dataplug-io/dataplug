const ConfigDeclaration = require('./configDeclaration');
const ConfigMapping = require('./configMapping');

module.exports = {
  ConfigDeclaration: ConfigDeclaration,
  get declare() {
    return new ConfigDeclaration();
  },
  ConfigMapping: ConfigMapping,
  get mapping() {
    return new ConfigMapping();
  }
};
