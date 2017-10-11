module.exports.build = (sourceOrTarget) => {
  const collection = sourceOrTarget.collection;

  let cli = {};

  cli.command = 'stream';
  cli.describe = `Streams data from stdin to '${collection.name}' collection`;
  cli.builder = (yargs) => {
    return yargs;
  };
  cli.handler = (argv) => {
    //TODO:
  };

  return cli;
};
