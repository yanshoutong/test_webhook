'use strict';

const colors = require('colors');

const http = require('http');
const util = require('util');
const Commando = require('./commando');
const log = require('./log');
const createHanlder = require('github-webhook-handler');
const handler = createHanlder({ path: '/crawler_event_intercept', secret: 'ics#2018' });

const Parser = require('./parser');

const USE_COLOR = false;

function LOGV(tag = 'NOTAG', obj = null) {
    log.info('#####', tag '#####');
    log.info(util.inspect(obj, { colors: USE_COLOR, depth: 10 }));
}

handler.on('error', err => {
    LOGV('ERROR', err);
});

handler.on('push', event => {
    LOGV('PUSH', event);
    let action = Parser.parsePushEvent(event);
    LOGV('PUSH ACTION', action);


   if (action.deleted) {
        log.info(`DELETE: ${action.ref}`.red.bold);
        return;
    }
    
    runCommand('sh', ['./deploy.sh', 'push', action.id, action.ref], text => {
        log.info('---------------------------------'.green.bold);
        log.info(text.green.bold);
    });
});

handler.on('pull_request', event => {
    LOGV('PUSH', event);
    let action = Parser.parsePullRequestEvent(event);
    LOGV("PULL_REQUEST ACTION", action);

    if ('opened' === action.action || 'synchronize' === action.action) {
        if ('opened' === action.action) {
        }

        let { output, exitCode } = await Commando.runCommand('sh', ['./deploy.sh', 'pull_request', action.id, 'origin/' + action.ref]);
    }
    else if ('closed' == action.action) {
        if (action.merged) {
            log.info('PULL_REQUEST merged'.inverse.red);
        } else {
            log.info('PULL_REQUEST closed whith unmerged commits'.inverse.blue);
        }
    }

});


http.createServer((req, res) => {
    handler(req, res, err => {
        res.statusCode = 404;
        res.end("no such location");
    });
}).listen(6583);
