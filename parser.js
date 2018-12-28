'use strict';

/*
{ event: 'push',
  id: '3688e834-0a4d-11e9-90bb-84783a1876a8',
  payload:
   { ref: 'refs/heads/master',
     before: 'c19bc8a67ed2218527faa327657da0fe9cf1371c',
     after: 'e1ec18035e50125fa60ab0900282b39623419b4c',
     created: false,
     deleted: false,
     forced: false,
     base_ref: null,
     compare: 'https://github.com/yanshoutong/test_webhook/compare/c19bc8a67ed2...e1ec18035e50',
     commits:
      [ { id: 'e1ec18035e50125fa60ab0900282b39623419b4c',
          tree_id: 'bcde73bce4ad5715f4e81b2cb9ee772b5df7d42c',
          distinct: true,
          message: 'add colors\n\nSigned-off-by: yanshoutong <yanshoutong@sina.cn>',
          timestamp: '2018-12-28T11:03:22+08:00',
          url: 'https://github.com/yanshoutong/test_webhook/commit/e1ec18035e50125fa60ab0900282b39623419b4c',
          author:
           { name: 'yanshoutong',
             email: 'yanshoutong@sina.cn',
             username: 'yanshoutong' },
          committer:
           { name: 'yanshoutong',
             email: 'yanshoutong@sina.cn',
             username: 'yanshoutong' },
          added: [],
          removed: [],
          modified: [ 'main.js', 'package-lock.json', 'package.json' ] } ],
*/

function parsePushEvent(push) {
    let title = `PUSH for ${event.payload.repository.name} to ${event.payload.ref}`;
    return {
        title: title,
        event: push.event,
        id: push.id,
        ref: push.payload.ref,
        commits: push.payload.commits,
    };
}


module.exports = {
    parsePushEvent,
}
