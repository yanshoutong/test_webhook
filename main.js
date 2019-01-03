'use strict';

const colors = require('colors');

const http = require('http');
const util = require('util');
const moment = require('moment');
const createHanlder = require('github-webhook-handler');
const handler = createHanlder({ path: '/crawler_event_intercept', secret: '1234567890' });

const log = require('./log');
const Parser = require('./parser');
const Commando = require('./commando');
const Issue = require('./issue_helper');

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

async function handlePushAction(action) {
    let { output, exitCode } = await Commando.runCommand('sh', ['./deploy.sh', 'push', action.id, uniformRef(action.ref)]);
    LOGV('Commando push', { output, exitCode });

    let body = '### PUSH  \n';
    let author = null;
    for (let commit of action.commits) {
        let timestamp = moment(commit.timestamp).format('YYYY-MM-DD HH:mm:ss');
        body += `- ${commit.id} at ${timestamp}  \n`;
        body += `> ${commit.message}  \n`; 

        if (commit.author && !author) {
            author = `${commit.author.name || commit.author.username}(${commit.author.email}) `;
        }
    }

    if (!exitCode) {
        await Issue.create({
            title: action.title,
            body: body,
            labels: [ 'BUILD_PASSED', 'SMOKE_TEST_PASSED' ]
        });
        return;
    }

    let mytitle = '';
    let mylabels = [];
    switch (exitCode) {
        case 1:
            mytitle += 'WEBHOOK ERROR - arguments error';
            mylabels.push('BUILD_FAILED');
            break;
        case 2:
            mytitle += 'WEBHOOK ERROR - failed to create $REPO folder';
            mylabels.push('BUILD_FAILED');
            break;
        case 3:
            mytitle += 'WEBHOOK ERROR - failed to do GIT CLONE action';
            mylabels.push('BUILD_FAILED');
            break;
        case 4:
            mytitle += 'failed to check out remote branch';
            mylabels.push('BUILD_FAILED');
            break;
        case 5:
            mytitle += 'failed to run npm install command';
            mylabels.push('BUILD_FAILED');
            break;
        case 6:
            mylabels.push('BUILD_PASSED');
            mylabels.push('SMOKE_TEST_FAILED');

            mytitle += 'smoke test failed';
            body += '\n---  \n';
            body += output;
            break;
        default:
            mytitle += 'WEBHOOK ERROR - unknown cases';
            break;
    }

    if (author) {
        mytitle += ' triggered by ' + author;
    }

    await Issue.create({
        title: mytitle,
        body: body,
        labels: mylabels
    });
}

async function handlePullRequestAction(action) {
    let { output, exitCode } = await Commando.runCommand('sh', ['./deploy.sh', 'pull_request', action.id, uniformRef(action.ref)]);
    LOGV('Commando pull_request', { output, exitCode });
 
    if (!exitCode) {
        await Issue.mark({
            number: action.number,
            labels: [ 'BUILD_PASSED', 'SMOKE_TEST_PASSED' ]
        });
        return;
    }

    let body = action.description;
    let mytitle = '';
    let mylabels = [];
    switch (exitCode) {
        case 1:
            mytitle += 'WEBHOOK ERROR - arguments error';
            mylabels.push('BUILD_FAILED');
            break;
        case 2:
            mytitle += 'WEBHOOK ERROR - failed to create $REPO folder';
            mylabels.push('BUILD_FAILED');
            break;
        case 3:
            mytitle += 'WEBHOOK ERROR - failed to do GIT CLONE action';
            mylabels.push('BUILD_FAILED');
            break;
        case 4:
            mytitle += 'failed to check out remote branch';
            mylabels.push('BUILD_FAILED');
            break;
        case 5:
            mytitle += 'failed to run npm install command';
            mylabels.push('BUILD_FAILED');
            break;
        case 6:
            mylabels.push('BUILD_PASSED');
            mylabels.push('SMOKE_TEST_FAILED');

            mytitle += 'smoke test failed';
            body += '\n---  \n';
            body += output;
            break;
        default:
            mytitle += 'WEBHOOK ERROR - unknown cases';
            break;
    }

    await Issue.create({
        title: mytitle,
        body: body,
        labels: mylabels
    });

}

handler.on('error', err => {
    LOGV('ERROR', err);
});

handler.on('push', async event => {
    //LOGV('PUSH', event);
    let action = Parser.parsePushEvent(event);
    LOGV('PUSH ACTION', action);


   if (action.deleted) {
        log.info(`DELETE: ${action.ref}`.red.bold);
        return;
    }
    
    await handlePushAction(action);
});

handler.on('pull_request', async event => {
    //LOGV('PULL_REQUEST', event);
    let action = Parser.parsePullRequestEvent(event);
    LOGV("PULL_REQUEST ACTION", action);

    if ('opened' === action.action || 'synchronize' === action.action) {
        await handlePullRequestAction(action);
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
