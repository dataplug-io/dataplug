const config = require('./config');
const Source = require('./source');
const SourceOutput = require('./sourceOutput');
const JsonSourceOutput = require('./jsonSourceOutput');
const validate = require('./validate');

function createSource(collection, configDeclaration, outputFactory) {
  return new Source(collection, configDeclaration, outputFactory);
};

module.exports = {
  config,
  source: createSource,
  Source,
  SourceOutput,
  JsonSourceOutput,
  validate
}
