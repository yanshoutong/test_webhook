'use strict';

const spawn = require('child_process').spawn;
const log = require('./log');

function runCommand(cmd, args) {
    log.info(`run command - ${cmd} ${args.join(' ')}`);
    return new Promise(resolve => {
        log.info('start to run command...');
        let child = spawn(cmd, args);
        let resp = '';

        child.stdout.on('data', buf => {
            log.info(buf.toString());
            resp += buf.toString();
        });

        child.stdout.on('end', buf => {
            log.info('child done');
        });

        child.on('error', err => {
            log.error(err);
        });

        child.on('exit', (code, signal) => {
            resolve({
                output: resp,
                exitCode: code
            });
        });

    });
}

module.exports = { runCommand }
