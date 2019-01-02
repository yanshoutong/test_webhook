'use strict';

function debug() {
    console.debug.apply(console, [...arguments]);
}


function info() {
    console.info.apply(console, [...arguments]);
}


function warn() {
    console.warn.apply(console, [...arguments]);
}


function error() {
    console.error.apply(console, [...arguments]);
}

module.exports = {
    debug: debug,
    info: info,
    warn: warn,
    error: error
}
