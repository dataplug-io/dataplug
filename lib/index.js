const config = require('./config');
const Source = require('./source');
const SourceOutput = require('./sourceOutput');
const JsonSourceOutput = require('./jsonSourceOutput');

function createSource(collection, configDeclaration, outputFactory) {
  return new Source(collection, configDeclaration, outputFactory);
};

module.exports = {
  config: config,
  source: createSource,
  Source: Source,
  SourceOutput: SourceOutput,
  JsonSourceOutput: JsonSourceOutput
}
