'use strict';

const util = require('util');
const request = require('request').defaults({ timeout: 30 * 1000 });
const log = require('./log');

const GITHUB_TOKEN = " token deb3628ca5eb2082acf8d38cb37e9fb210d6fda9";
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';


// Make the request(options, callback) synchronous
async function requestSync(options) {
    if (options.headers) {
        options.headers['Authorization'] = GITHUB_TOKEN;
        options.headers['User-Agent'] = USER_AGENT;
    }
    else {
        options.headers = { 
            'Authorization': GITHUB_TOKEN,
            'User-Agent': USER_AGENT,
        };
    }

    return new Promise((resolve, reject) => {
        request(options, function(err, res, data) {
            resolve({err, res, data});
        });
    });
}


async function create({ title = 'NO TITLE', body = 'NO BODY', labels = [] } = {}) {
    let { err, res, data } = await requestSync({
        url: 'https://api.github.com/repos/yanshoutong/test_webhook/issues',
        method: 'POST',
        body: {
            'title': title || 'no title',
            'body': body || 'no body',
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
        url: `https://api.github.com/repos/yanshoutong/test_webhook/issues/${number}/comments`,
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

    let { err, res, data } = await requestSync({
        url: `https://api.github.com/repos/yanshoutong/test_webhook/issues/${number}`,
        method: 'PATCH',
        body: {
            labels: labels
        }
    });

    if (err) {
        log.error('mark{}', err);
        return false;
    }

    if (res.statusCode !== 200) {
        log.error('mark{}', `received statusCode is ${res.statusCode} - body: ${data}`);
        return false;
    }

    log.info('mark{}', 'done!');
    return true;
}


module.exports = {
    create: create,
    appendComment: appendComment,
    mark: mark,
}
