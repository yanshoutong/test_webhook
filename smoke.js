'use strict';

const colors = require('colors');

!async function() {
    console.log('start to run smoke test...'.green.bold);
    console.log('start to run smoke test...'.green.bold);
    console.log('start to run smoke test...'.green.bold);
    await new Promise(resolve => setTimeout(resolve, 5 * 1000));
    console.log('smoke test done'.green.bold);
    process.exit(1);
}();

