'use strict';

const colors = require('colors');

const http = require('http');
const util = require('util');
const PQ = require('p-queue');
const moment = require('moment');
const createHanlder = require('github-webhook-handler');
const handler = createHanlder({ path: '/crawler_event_intercept', secret: '1q2w3e4r5t' });

const log = require('./log');
const Parser = require('./parser');
const Commando = require('./commando');
const Issue = require('./issue_helper');

const USE_COLOR = false;

// here we run only one command at the time, otherwise, we cannot bring crawler
// server up because of the port number occupation error.
const Queue = new PQ({ concurrency: 1 });


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
    let mytitle = '';
    let authors = [];

    for (let commit of action.commits) {
        let timestamp = moment(commit.timestamp).format('YYYY-MM-DD HH:mm:ss');
        body += `- ${commit.id} at ${timestamp}  \n`;
        body += `> ${commit.message}  \n`; 

        if (commit.author) {
            authors.push(commit.author.username);
        }

    }

    let prNum = await Issue.getPullNumber(action.ref);
    if (!exitCode) {
        if (authors.length) {
            mytitle = action.title + ' triggered by ' + authors[0];
        }

        if (!Issue.isPresetBranch(action.ref)) {
            if (prNum >= 0) {
                await Issue.mark({
                    number: prNum,
                    labels: [ 'BUILD_PASSED', 'SMOKE_TEST_PASSED' ]
                });

                return;
            }

        } 

        await Issue.create({
            title: mytitle,
            body: body,
            assignees: authors,
            labels: [ 'BUILD_PASSED', 'SMOKE_TEST_PASSED' ]
        });

        return;
    }

    body += '\n---  \n';
    body += "```sh\n";
    body += output;
    body += "\n```";

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
           break;
        default:
            mytitle += 'WEBHOOK ERROR - unknown cases';
            break;
    }

    if (authors.length) {
        mytitle += ' triggered by ' + authors[0];
    }

    let { err, res, data } = await Issue.create({
        title: mytitle,
        body: body,
        assignees: authors,
        labels: mylabels
    });

    if (res && res.statusCode === 201 && prNum >= 0) {
        let issueN = data.number;

        let comments = `Your PR(#${prNum}) resulted in`;
        for (let l of mylabels) {
            comments += `  *${l}*  `;
        }
        comments += `, and we have raised one issue(#${issueN}), you can `;
        comments += `navigate to **Issue** tab and check it out for more details.`;

        await Issue.appendComment({ number: prNum, body: comments });
    }

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

    let { err, res, data } = await Issue.create({
        title: mytitle,
        body: body,
        labels: mylabels
    });

    if (res && res.statusCode === 201) {
        let issueN = data.number;

        let comments = `Your PR(#${action.number}) resulted in `;
        for (let l of mylabels) {
            comments += `  *${l}*  `;
        }
        comments += `, and we have raised one issue(#${issueN}), you can `;
        comments += `navigate to **Issue** tab and check it out for more details.`;

        await Issue.appendComment({ number: action.number, body: comments });
    }

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

    if (await Issue.shouldDeploy(action.ref)) {
        Queue.add(async () => await handlePushAction(action)).then(() => {
            log.info('deployment done - push event');
        });
    }
});

handler.on('pull_request', async event => {
    //LOGV('PULL_REQUEST', event);
    let action = Parser.parsePullRequestEvent(event);
    LOGV("PULL_REQUEST ACTION", action);

    if ('opened' === action.action) {
        Queue.add(async () => await handlePullRequestAction(action)).then(() => {
            log.info('deployment done - PR event');
        });
    }
    else if ('synchronize' === action.action) {
        log.info(`${action.ref} is synchronized now`);
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
