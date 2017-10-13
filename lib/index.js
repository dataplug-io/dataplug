const Source = require('./source');
const SourceOutput = require('./sourceOutput');
const JsonSourceOutput = require('./jsonSourceOutput');

module.exports = {
  source: (collection, outputClass) => {
    return new Source(collection, outputClass);
  },
  cli: require('./cli'),
  Source: Source,
  SourceOutput: SourceOutput,
  JsonSourceOutput: JsonSourceOutput
}
