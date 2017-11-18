const config = require('./config')
const ConfigDeclaration = require('./configDeclaration')
const ConfigMapping = require('./configMapping')
const Filter = require('./filter')
const JsonUtils = require('./jsonUtils')
const Mapper = require('./mapper')
const replicate = require('./replicate')
const Replicator = require('./replicator')
const ReplicationChainBuilder = require('./replicationChainBuilder')
const Sequence = require('./sequence')
const Scanner = require('./scanner')
const Source = require('./source')
const Target = require('./target')

function createSource (configDeclaration, outputFactory) {
  return new Source(configDeclaration, outputFactory)
};

function createTarget (configDeclaration, inputFactory) {
  return new Target(configDeclaration, inputFactory)
};

module.exports = {
  config,
  ConfigDeclaration,
  ConfigMapping,
  Filter,
  JsonUtils,
  Mapper,
  replicate,
  Replicator,
  ReplicationChainBuilder,
  Sequence,
  Scanner,
  source: createSource,
  Source,
  target: createTarget,
  Target
}
