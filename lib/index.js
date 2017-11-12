const config = require('./config')
const ConfigDeclaration = require('./configDeclaration')
const ConfigMapping = require('./configMapping')
const DataFlatter = require('./dataFlatter')
const Filter = require('./filter')
const FlattenedMetadataFilter = require('./flattenedMetadataFilter')
const FlattenedTransformStream = require('./flattenedTransformStream')
const FlatterNaming = require('./flatterNaming')
const JsonUtils = require('./jsonUtils')
const MappedStream = require('./mappedStream')
const Replicator = require('./replicator')
const ReadableSequence = require('./readableSequence')
const Scanner = require('./scanner')
const SchemaFlatter = require('./schemaFlatter')
const StreamFlatter = require('./streamFlatter')
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
  DataFlatter,
  Filter,
  FlattenedMetadataFilter,
  FlattenedTransformStream,
  FlatterNaming,
  JsonUtils,
  MappedStream,
  Replicator,
  ReadableSequence,
  Scanner,
  SchemaFlatter,
  StreamFlatter,
  source: createSource,
  Source,
  target: createTarget,
  Target
}
