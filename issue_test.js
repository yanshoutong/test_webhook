'use strict'; 

const colors = require('colors');
const Issue = require('./issue_helper'); 

! async function() {
    console.log('start to do test...'.green.bold);
    await Issue.mark({
        number: 15,
        labels: [ 'SMOKE_TEST_PASSED', 'BUILD_PASSED' ]
    });
    console.log('------- done ------'.green.bold);
}();
