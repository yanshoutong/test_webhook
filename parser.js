'use strict';

function parsePushEvent(push) {
    let title = `PUSH for ${push.payload.repository.name} to ${push.payload.ref}`;

    return {
        event: push.event,
        title: title,
        id: push.id,
        ref: push.payload.ref,

        before: push.payload.before,
        after: push.payload.after,
        created: push.payload.created,
        deleted: push.payload.deleted,
        forced: push.payload.forced,
        commits: push.payload.commits,
    };
}


function parsePullRequestEvent(issue) {
    let title = `PULL REQUEST for ${issue.payload.pull_request.head.repo.full_name} to ${issue.payload.pull_request.head.ref}`;

    return {
      event: issue.event,
      title: title,
      id: issue.id,
      ref: issue.payload.pull_request.head.ref,
      
      number: issue.payload.number,
      action: issue.payload.action,
      merged: issue.payload.pull_request.merged,
      user: issue.payload.pull_request.user.login,
      merge_commit_sha: issue.payload.pull_request.merge_commit_sha,
      description: issue.payload.pull_request.body
    };
}

module.exports = {
    parsePushEvent,
    parsePullRequestEvent,
}
