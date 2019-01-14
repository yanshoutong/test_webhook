'use strict';

const colors = require('colors');
const util = require('util');
const request = require('request').defaults({ timeout: 30 * 1000 });
const log = require('./log');

const GITHUB_BASE_URL = 'https://api.github.com/repos/yanshoutong/test_webhook';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';


// Make the request(options, callback) synchronous
async function requestSync(options) {
    if (options.headers) {
        options.headers['User-Agent'] = USER_AGENT;
    }
    else {
        options.headers = { 
            'User-Agent': USER_AGENT,
        };
    }

    options.auth = {
        user: process.env['GITHUB_WEBHOOK_USERNAME'],
        pass: process.env['GITHUB_WEBHOOK_PASSWORD']
    };

    return new Promise((resolve, reject) => {
        request(options, function(err, res, data) {
            resolve({err, res, data});
        });
    });
}


async function _resetLabels(number) {
    let { err, res, data } = await requestSync({
        url: `${GITHUB_BASE_URL}/issues/${number}/labels`,
        method: 'PUT',
        body: {
            labels: []
        },
        json: true

    });

    if (err) {
        log.error('_resetLabels{}', err);
        return false;
    }

    if (res.statusCode !== 200) {
        log.error('_resetLabels{}', `received statusCode is ${res.statusCode} - body: ${JSON.stringify(data, null, 4)}`);
        return false;
    }

    log.info('_resetLabels{}', 'done!');
    return true;

}

async function create({ title = 'NO TITLE', body = 'NO BODY', labels = [], assignees = [] } = {}) {
    let { err, res, data } = await requestSync({
        url: `${GITHUB_BASE_URL}/issues`,
        method: 'POST',
        body: {
            'title': title || 'no title',
            'body': body || 'no body',
            assignees: assignees,
            'labels': labels,
        },
        json: true,
    });

    if (err) {
        log.error('create{}', err);
        return false;
    }

    if (res.statusCode !== 201) {
        log.error('create{}', `received statusCode is ${res.statusCode} - body: ${JSON.stringify(data, null, 4)}`);
        return false;
    }

    log.info('create{}', 'done!');
    return true;
}

async function appendComment({ number = null, body = null } = {}) {
    if (!number || typeof number !== 'number') {
        log.error('issue #number is invalid');
        return false;
    }

    if (!body) {
        log.error('no body to commit');
        return false;
    }

    let { err, res, data } = await requestSync({
        url: `${GITHUB_BASE_URL}/issues/${number}/comments`,
        method: 'POST',
        body: {
            'body': body
        },
        json: true,
    });

    if (err) {
        log.error('appendComment{}', err);
        return false;
    }

    if (res.statusCode !== 201) {
        log.error('appendComment{}', `received statusCode is ${res.statusCode} - body: ${JSON.stringify(data, null, 4)}`);
        return false;
    }

    log.info('appendComment{}', 'done!');
    return true;

}

async function mark({ number = null, labels = [] } = {}) {
    if (!number || typeof number !== 'number') {
        log.error('issue #number is invalid');
        return false;
    }

    if (labels.length < 1) {
        log.error('no labels to be marked');
        return false;
    }

    await _resetLabels(number);

    let { err, res, data } = await requestSync({
        url: `${GITHUB_BASE_URL}/issues/${number}`,
        method: 'PATCH',
        body: {
            labels: labels
        },
        json: true,
    });

    if (err) {
        log.error('mark{}', err);
        return false;
    }

    if (res.statusCode !== 204) {
        log.error('mark{}', `received statusCode is ${res.statusCode} - body: ${JSON.stringify(data, null, 4)}}`);
        return false;
    }

    log.info('mark{}', 'done!');
    return true;
}

function isPresetBranch(ref) {
    if ([
        'refs/heads/master', 
        'refs/heads/release_admin',
        'refs/heads/release_crawler',
        'refs/heads/release_frontend',
        'refs/heads/release_monitor'
    ].includes(ref)) {
        log.info(`${ref} is preset branch`);
        return true;
    }

    log.info(`${ref} is not preset branch`);
    return false;
}


async function getPulls() {
    let { err, res, data } = await requestSync({
        url: `${GITHUB_BASE_URL}/pulls`,
        method: 'GET',
        body: {
            state: 'open',
        },
        json: true,
    });

    if (err) {
        log.error('getPulls{}', err);
        return [];
    }

    if (res.statusCode !== 200) {
        log.error('getPulls{}', `received statusCode is ${res.statusCode} - body: ${JSON.stringify(data, null, 4)}}`);
        return [];
    }

    if (!Array.isArray(data)) {
        log.error('getPulls{}', 'data is not an array');
        return [];
    }

    return [...data];
}

async function shouldDeploy(ref) {
    if (!ref) {
        log.error('shouldDeploy{} ref is null');
        return false;
    }

    if (isPresetBranch(ref)) return true;
    let data = await getPulls();
    
    return data.some(e => {
        console.log(`${ref} <-> ${e.head.ref} = ${ref.includes(e.head.ref)}`.blue.bold);
        return ref.includes(e.head.ref);
    });
}

async function getPullNumber(ref) {
    if (!ref) {
        log.error('getPullNumber{} ref is null');
        return -1;
    }

    if (isPresetBranch(ref)) {
        log.warn(`getPullNumber{} ${ref} is preset`);
        return -1;
    }

    let data = await getPulls();
    for (let pr of data) {
        if (ref.includes(pr.head.ref)) return pr.number;
    }

    return -1;
}

module.exports = {
    create: create,
    appendComment: appendComment,
    mark: mark,
    getPulls: getPulls,
    getPullNumber: getPullNumber,
    shouldDeploy: shouldDeploy,
    isPresetBranch: isPresetBranch,
}
