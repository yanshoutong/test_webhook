'use strict';

const colors = require('colors');

const http = require('http');
const util = require('util');
const Commando = require('./commando');
const log = require('./log');
const createHanlder = require('github-webhook-handler');
const handler = createHanlder({ path: '/crawler_event_intercept', secret: '1234567890' });

const Parser = require('./parser');

const USE_COLOR = false;

function LOGV(tag = 'NOTAG', obj = null) {
    log.info('#####', tag, '#####');
    log.info(util.inspect(obj, { colors: USE_COLOR, depth: 10 }));
}

function uniformRef(ref) {
    if (ref.startsWith('refs/heads')) return ref.replace('refs/heads', 'origin');
    else if (!ref.startsWith('origin')) return 'origin/' + ref;
    return ref;
}

handler.on('error', err => {
    LOGV('ERROR', err);
});

handler.on('push', async event => {
    LOGV('PUSH', event);
    let action = Parser.parsePushEvent(event);
    LOGV('PUSH ACTION', action);


   if (action.deleted) {
        log.info(`DELETE: ${action.ref}`.red.bold);
        return;
    }
    
    let { output, exitCode } = await Commando.runCommand('sh', ['./deploy.sh', 'push', action.id, uniformRef(action.ref)]);
    LOGV('Commando push', { output, exitCode });
});

handler.on('pull_request', async event => {
    LOGV('PUSH', event);
    let action = Parser.parsePullRequestEvent(event);
    LOGV("PULL_REQUEST ACTION", action);

    if ('opened' === action.action || 'synchronize' === action.action) {
        if ('opened' === action.action) {
        }

        let { output, exitCode } = await Commando.runCommand('sh', ['./deploy.sh', 'pull_request', action.id, uniformRef(action.ref)]);
        LOGV('Commando pull_request', { output, exitCode });
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
