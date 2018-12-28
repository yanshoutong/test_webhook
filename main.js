'use strict';

const colors = require('colors');
const http = require('http');
const util = require('util');
const spawn = require('child_process').spawn;
const createHanlder = require('github-webhook-handler');
const handler = createHanlder({ path: '/crawler_event_intercept', secret: 'ics#2018' });

const Parser = require('./parser');
const USE_COLOR = false;

function LOGV(tag = 'NOTAG', obj = null) {
    console.log('##########', tag);
    console.log(util.inspect(obj, { colors: USE_COLOR, depth: 10 }));
}

function runCommand(cmd, args, callback) {
    let childProcess = spawn(cmd, args);
    let resp = '';

    childProcess.stdout.on('data', buffer => {
        resp += buffer.toString();
    });

    childProcess.stdout.on('end', () => {
        if (callback) callback(resp);
        resp = '';
    });
}

handler.on('error', err => {
    LOGV('ERROR', err);
});

handler.on('push', event => {
    LOGV('PUSH', event);
    let action = Parser.parsePushEvent(event);
    LOGV('PUSH ACTION', action);

    if (action.deleted) {
        console.log(`DELETE: ${action.ref}`.red.bold);
        return;
    }
    
    runCommand('sh', ['./deploy.sh', 'PUSH', action.id], text => {
        console.log('---------------------------------'.green.bold);
        console.log(text.green.bold);
    });
});

handler.on('pull_request', event => {
    LOGV('PUSH', event);
    let action = Parser.parsePullRequestEvent(event);
    LOGV("PULL_REQUEST ACTION", action);

    if ('opened' === action.action || 'synchronize' === action.action) {
        runCommand('sh', ['./deploy.sh', 'pull_request'], text => {
            console.log('---------------------------------'.yellow.bold);
            console.log(text.yellow.bold);
        });        
    }
    else if ('closed' == action.action) {
        if (action.merged) {
            console.log('PULL_REQUEST merged'.inverse.red);
        } else {
            console.log('PULL_REQUEST closed whith unmerged commits');
        }
    }

});


http.createServer((req, res) => {
    handler(req, res, err => {
        res.statusCode = 404;
        res.end("no such location");
    });
}).listen(6583);
