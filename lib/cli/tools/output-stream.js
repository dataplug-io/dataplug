const _ = require('lodash');
const Ajv = require('ajv');
const readline = require('readline');
const chalk = require('chalk');
const validate = require('../../validate');

module.exports.build = (source) => {
  const collection = source.collection;
  const output = new source.outputClass();

  let cli = {};

  cli.command = 'stream';
  if (output.cliCommandSuffix) {
    cli.command += output.cliCommandSuffix;
  }
  cli.describe = `Streams '${collection.name}' collection data to stdout`;
  cli.builder = output.cli; //TODO: support "no validation" & "skip-invalid"
  cli.handler = (argv) => {
    const validator = new Ajv({
      allErrors: false
    }).compile(collection.schema);

    let progress = {
      processedEntriesCount: 0,
      invalidEntriesCount: 0,
      validEntriesCount: 0
    };
    const printProgress = () => {
      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.white('🔍') + ` processed: ${progress.processedEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.green('✓') + `  valid: ${progress.validEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.red('✗') + `  invalid: ${progress.invalidEntriesCount}\n`);
    };
    if (argv.progress) {
      printProgress();
    }

    source.createOutput(argv).then((output) => {
      for (let entry of output) {
        validationResult = validator(entry);
        if (!validationResult) {
          progress.invalidEntriesCount += 1;
        } else {
          progress.validEntriesCount += 1;
        }
        progress.processedEntriesCount += 1;

        if (argv.progress) {
          readline.cursorTo(process.stderr, 0, null);
          readline.moveCursor(process.stderr, 0, -3);
          printProgress();
        }

        //TODO: print to output

        if (!validationResult && (argv.fail || argv.stop)) {
          break;
        }
      }

      if (argv.fail && progress.invalidEntriesCount > 0) {
        process.exitCode = 65; /* EX_DATAERR */
      }
      process.exit();
    }).catch((reason) => {
      console.error(chalk.red('❗'), reason);
      process.exit(70); /* EX_SOFTWARE */
    });
  };

  return cli;
};
