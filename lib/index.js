const config = require('./config')
const ConfigDeclaration = require('./configDeclaration')
const ConfigMapping = require('./configMapping')
const Filter = require('./filter')
const JsonUtils = require('./jsonUtils')
const MappedStream = require('./mappedStream')
const replicate = require('./replicate')
const Replicator = require('./replicator')
const ReplicationChainBuilder = require('./replicationChainBuilder')
const ReadableSequence = require('./readableSequence')
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
  MappedStream,
  replicate,
  Replicator,
  ReplicationChainBuilder,
  ReadableSequence,
  Scanner,
  source: createSource,
  Source,
  target: createTarget,
  Target
}
