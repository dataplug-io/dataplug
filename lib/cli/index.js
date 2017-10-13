const yargs = require('yargs');

function buildCli(sourceOrTarget, tools) {
  return (collectionsDir) => {
    return yargs
      .strict()
      .commandDir(collectionsDir, {
        visit: (collectionModule, pathToFile, filename) => {
          const collection = collectionModule[sourceOrTarget].collection;

          let cli = {};
          cli.command = collection.name;
          cli.describe = `Lists tools for '${collection.name}' collection`;
          cli.builder = (yargs) => {
            tools.forEach((tool) => {
              yargs.command(require(`./tools/${tool}`).build(collectionModule[sourceOrTarget]));
            });
            return yargs
              .demandCommand(1, 1, 'Please specify a tool as a command');
          };
          cli.handler = (argv) => {};

          return cli;
        }
      })
      .demandCommand(1, 1, 'Please specify a collection as a command')
      .option('indent', {
        alias: 'i',
        describe: 'Prettify output JSON using given amount of spaces',
        type: 'string'
      })
      .coerce('indent', value => {
        value = parseInt(value);
        return value ? value : undefined;
      })
      .option('progress', {
        alias: 'p',
        describe: 'Show progress'
      })
      .help();
  };
}

module.exports.source = buildCli('source', ['schema', 'validator', 'output-stream']);
