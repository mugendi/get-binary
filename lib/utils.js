/**
 * Copyright (c) 2023 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
const download = require('download');
const ProgressBar = require('./progress-bar');
const progressBar = new ProgressBar();

function is_object(value) {
    if (!value) return false;
    return value.toString() === '[object Object]';
}

function arrify(v) {
    if (v === undefined) return [];
    return Array.isArray(v) ? v : [v];
}

function download_file(url, dest) {
    // download...and extract
    let downloadProcess = download(url, dest, { extract: true });

    downloadProcess.on('downloadProgress', function (ev) {
        progressBar.show(ev.percent);
    });

    return downloadProcess;
}

module.exports = { is_object, arrify, download_file };
