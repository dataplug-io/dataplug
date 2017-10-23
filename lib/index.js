const config = require('./config')
const Filter = require('./filter')
const Flatter = require('./flatter')
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
  Filter,
  Flatter,
  Scanner,
  source: createSource,
  Source,
  target: createTarget,
  Target
}
