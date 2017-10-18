const config = require('./config');
const Source = require('./source');
const SourceOutput = require('./sourceOutput');
const JsonSourceOutput = require('./jsonSourceOutput');
const Target = require('./target');
const TargetInput = require('./targetInput');
const validate = require('./validate');

function createSource(configDeclaration, outputFactory) {
  return new Source(configDeclaration, outputFactory);
};

function createTarget(configDeclaration, inputFactory) {
  return new Target(configDeclaration, inputFactory);
};

module.exports = {
  config,
  source: createSource,
  Source,
  SourceOutput,
  JsonSourceOutput,
  target: createTarget,
  Target,
  TargetInput,
  validate
}
