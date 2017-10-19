const config = require('./config');
const Filter = require('./filter');
const Flatter = require('./flatter');
const JsonSequentialStreamsReader = require('./jsonSequentialStreamsReader');
const JsonStreamReader = require('./jsonStreamReader');
const JsonStreamWriter = require('./jsonStreamWriter');
const Scanner = require('./scanner');
const Source = require('./source');
const Target = require('./target');

function createSource(configDeclaration, outputFactory) {
  return new Source(configDeclaration, outputFactory);
};

function createTarget(configDeclaration, inputFactory) {
  return new Target(configDeclaration, inputFactory);
};

module.exports = {
  config,
  Filter,
  Flatter,
  JsonSequentialStreamsReader,
  JsonStreamReader,
  JsonStreamWriter,
  Scanner,
  source: createSource,
  Source,
  target: createTarget,
  Target
}
