'use strict';

const http = require('http');
const spawn = require('child_process').spawn;
const createHanlder = require('github-webhook-handler');
const handler = createHanlder({ path: '/crawler_event_intercept', secret: 'ics#2018' });

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

handler.on('push', event => {
    console.log('[x] Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref);
    runCommand('sh', ['./deploy.sh'], text => {
        console.log('---------------------------------');
        console.log(text);
    });
});

http.createServer((req, res) => {
    handler(req, res, err => {
        res.statusCode = 404;
        res.end("no such location");
    });
}).listen(6583);



