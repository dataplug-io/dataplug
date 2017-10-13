const Ajv = require('ajv');
const readline = require('readline');
const chalk = require('chalk');
const validate = require('../../../validate');

module.exports.build = (sourceOrTarget) => {
  const collection = sourceOrTarget.collection;

  let cli = {};

  cli.command = 'filter';
  cli.describe = `Outputs the stream from stdin to stdout, filtered as \'${collection.name}\' collection data`;
  cli.builder = (yargs) => {
    return yargs
      .option('dry-run', {
        alias: 'n',
        describe: 'Do not filter invalid enries from the output data'
      });
  };
  cli.handler = (argv) => {
    const validator = new Ajv({
      allErrors: false
    }).compile(collection.schema);

    let progress = {
      filteredEntriesCount: 0,
      invalidEntriesCount: 0,
      validEntriesCount: 0
    };
    const printProgress = () => {
      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.white('?') + ` filtered: ${progress.filteredEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.green('✓') + ` valid: ${progress.validEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.red('✗') + ` invalid: ${progress.invalidEntriesCount}\n`);
    };
    const updateProgress = () => {
      if (argv.progress) {
        readline.cursorTo(process.stderr, 0, null);
        readline.moveCursor(process.stderr, 0, -3);
        printProgress();
      }
    };
    if (argv.progress) {
      printProgress();
      setInterval(updateProgress, 100);
    }

    validate(process.stdin, validator, (entry, validationResult) => {
      if (!validationResult) {
        progress.invalidEntriesCount += 1;
      } else {
        progress.validEntriesCount += 1;
      }
      progress.filteredEntriesCount += 1;

      if (!argv.dryRun) {
        //TODO: print valid json
      }

      if (!validationResult && (argv.fail || argv.stop)) {
        return false;
      }
    }).then((validationResult) => {
      if (argv.fail && progress.invalidEntriesCount > 0) {
        process.exitCode = 65; /* EX_DATAERR */
      }

      updateProgress();
      process.exit();
    }).catch((reason) => {
      console.error(chalk.red('❗'), reason);
      process.exit(70); /* EX_SOFTWARE */
    });
  };

  return cli;
};
