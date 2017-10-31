const config = require('./config')
const ConfigDeclaration = require('./configDeclaration')
const ConfigMapping = require('./configMapping')
const DataFlatter = require('./dataFlatter')
const Filter = require('./filter')
const FlatterNaming = require('./flatterNaming')
const JsonUtils = require('./jsonUtils')
const MappedStream = require('./mappedStream')
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
  FlatterNaming,
  JsonUtils,
  MappedStream,
  ReadableSequence,
  Scanner,
  SchemaFlatter,
  StreamFlatter,
  source: createSource,
  Source,
  target: createTarget,
  Target
}
