const Source = require('./source');
const SourceOutput = require('./sourceOutput');
const JsonSourceOutput = require('./jsonSourceOutput');

module.exports = {
  source: (collection, outputPrototype, cliBuilder) => {
    return new Source(collection, outputPrototype, cliBuilder);
  },
  cli: require('./cli'),
  Source: Source,
  SourceOutput: SourceOutput,
  JsonSourceOutput: JsonSourceOutput
}
