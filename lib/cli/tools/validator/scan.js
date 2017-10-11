const _ = require('lodash');
const Ajv = require('ajv');
const readline = require('readline');
const chalk = require('chalk');
const validate = require('../../../validate');

module.exports.build = (sourceOrTarget) => {
  const collection = sourceOrTarget.collection;

  let cli = {};

  cli.command = 'scan';
  cli.describe = `Scans the stream from stdin as \'${collection.name}\' collection data and output results`;
  cli.builder = (yargs) => {
    return yargs
      .option('results', {
        alias: 'o',
        describe: 'Print the results in machine-readable format'
      });
  };
  cli.handler = (argv) => {
    const validator = new Ajv({
      allErrors: true
    }).compile(collection.schema);

    let progress = {
      scannedEntriesCount: 0,
      invalidEntriesCount: 0,
      validEntriesCount: 0
    };
    const printProgress = () => {
      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.white('🔍') + ` scanned: ${progress.scannedEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.green('✓') + `  valid: ${progress.validEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.red('✗') + `  invalid: ${progress.invalidEntriesCount}\n`);
    };
    if (argv.progress) {
      printProgress();
    }

    validate(process.stdin, validator, (entry, validationResult) => {
      if (!validationResult) {
        progress.invalidEntriesCount += 1;
      } else {
        progress.validEntriesCount += 1;
      }
      progress.scannedEntriesCount += 1;

      if (argv.progress) {
        readline.cursorTo(process.stderr, 0, null);
        readline.moveCursor(process.stderr, 0, -3);
        printProgress();
      }

      if (!validationResult && (argv.fail || argv.stop)) {
        return false;
      }
    }).then((validationResult) => {
      if (argv.results) {
        process.stdout.write(JSON.stringify(progress, null, argv.indent ? _.repeat(' ', parseInt(argv.indent)) : null));
      }

      if (argv.fail && results.invalidEntriesCount > 0) {
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
