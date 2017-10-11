module.exports.build = (sourceOrTarget) => {
  const collection = sourceOrTarget.collection;

  let cli = {};

  cli.command = 'validator';
  cli.describe = `Validates stream from stdin as \'${collection.name}\' collection data`;
  cli.builder = (yargs) => {
    return yargs
      .command(require('./validator/filter').build(sourceOrTarget))
      .command(require('./validator/scan').build(sourceOrTarget))
      .demandCommand(1, 1, 'Please specify a mode as a command')
      .option('stop', {
        alias: 's',
        describe: 'Stop on invalid data with success'
      })
      .option('fail', {
        alias: 'f',
        describe: 'Fail on invalid data with failure',
      })
      .conflicts('stop', 'fail');
  };
  cli.handler = (argv) => {};

  return cli;
};
