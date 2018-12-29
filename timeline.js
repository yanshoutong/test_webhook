'use strict';

const util = require('util');

class Timeline {
    constructor() {
        this.load();
    }

    load() {
        //TODO: initialize the timeline data from local file
        this.data = [];
    }

    addPushAction(push) {
        this.data.push(Object.assign({}, push));
    }

    addPullRequestAction(issue) {
        this.data.push(Object.assign({}, issue));
    }

    isPush(action) {
        if (action) return 'push' === action.action;
        return false;
    }

    isPullRequest(action) {
        if (action) return 'pull_request' === action.action;
        return false;
    }

    isMergeCommit(sha) {
        if (!sha) return false;

        return this.data.some(e => {
            if (this.isPullRequest(e)) {
                return e.merge_commit_sha === sha;
            }
            return false;
        });
    }
}

moudle.exports = Timeline;
