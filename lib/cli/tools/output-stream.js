const _ = require('lodash');
const Ajv = require('ajv');
const readline = require('readline');
const chalk = require('chalk');
const validate = require('../../validate');

module.exports.build = (source) => {
  const collection = source.collection;

  let cli = {};

  cli.command = 'stream';
  cli.describe = `Streams '${collection.name}' collection data to stdout`;
  cli.builder = (yargs) => {
    return source.buildCli(yargs)
      .option('stop', {
        alias: 's',
        describe: 'Stop on invalid data with success'
      })
      .option('fail', {
        alias: 'f',
        describe: 'Fail on invalid data with failure',
      })
      .conflicts('stop', 'fail')
      .option('skip-validation', {
        alias: 't',
        describe: 'Skip output data validation'
      })
      .option('omit-invalid', {
        alias: 'o',
        describe: 'Omit invalid entries from output'
      });
  };
  cli.handler = (argv) => {
    const validator = new Ajv({
        allErrors: false
      })
      .compile(collection.schema);

    let progress = {
      processedEntriesCount: 0,
      invalidEntriesCount: 0,
      validEntriesCount: 0
    };
    const printProgress = () => {
      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.white('?') + ` processed: ${progress.processedEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.green('✓') + ` valid: ${progress.validEntriesCount}\n`);

      readline.clearLine(process.stderr, 0);
      process.stderr.write(chalk.red('✗') + ` invalid: ${progress.invalidEntriesCount}\n`);
    };
    const updateProgress = () => {
      readline.cursorTo(process.stderr, 0, null);
      readline.moveCursor(process.stderr, 0, -3);
      printProgress();
    };
    if (argv.progress) {
      printProgress();
      setInterval(updateProgress, 100);
    }

    source.createOutput(argv)
      .then((output) => {
        output
          .on('data', (entry) => {
            validationResult = !!argv.skipValidation || validator(entry);
            if (!validationResult) {
              progress.invalidEntriesCount += 1;
            } else {
              progress.validEntriesCount += 1;
            }
            progress.processedEntriesCount += 1;

            if (validationResult || (!validationResult && !argv.omitInvalid)) {
              //TODO: print to output
            }

            if (!validationResult && (argv.fail || argv.stop)) {
              output.destroy();
            }
          })
          .on('end', () => {
            if (argv.progress) {
              updateProgress();
            }
            process.exit();
          })
          .on('error', (reason) => {
            if (reason) {
              console.error(chalk.red('❗'), reason);
            }

            if (argv.fail) {
              if (process.exitCode === 0) {
                process.exitCode = 65; /* EX_DATAERR */
              }

              if (argv.progress) {
                updateProgress();
              }
              process.exit();
            }
          });
        output.resume();
      })
      .catch((reason) => {
        console.error(chalk.red('❗'), reason);
        process.exit(70); /* EX_SOFTWARE */
      });
  };

  return cli;
};