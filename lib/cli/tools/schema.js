module.exports.build = (sourceOrTarget) => {
  const collection = sourceOrTarget.collection;

  let cli = {};

  cli.command = 'schema';
  cli.describe = `Prints '${collection.name}' collection schema to stdout`;
  cli.builder = (yargs) => {
    return yargs;
  };
  cli.handler = (argv) => {
    process.stdout.write(collection.schema);
  };

  return cli;
};
