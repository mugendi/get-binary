// Copyright 2021 Anthony Mugendi
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const os = require('os'),
    path = require('path'),
    which = require('which'),
    validate = require('aproba'),
    fs = require('fs-extra'),
    rimraf = require('rimraf'),
    chalk = require('chalk'),
    isAbsoluteUrl = require('is-absolute-url'),
    download = require('download'),
    decompress = require('decompress'),
    moveFile = require('move-file'),
    crypto = require('crypto'),
    fg = require('fast-glob'),
    ProgressBar = require('./lib/progress-bar'),
    progressBar = new ProgressBar();


class Helper {
    constructor() {
        this.binariesDir = path.join(os.homedir(), '.node_binaries');
    }




    __get_os() {

        let platform;

        switch (os.platform()) {
            case 'darwin':
                platform = 'mac';
                break;
            case 'linux':
                platform = 'linux';
                break;
            case 'win32':
                platform = 'windows';
                break;

            default:
                break;
        }

        return {
            platform,
            arch: process.arch
        };
    }

    async __get_folder_file_hash(dir) {
        validate("S", arguments);


        const entries = await fg([path.join(dir, "*"), path.join(dir, "**/*")], { dot: true, deep: 2, stats: true });


        let size = entries.reduce((a, b) => a + b.stats.size, 0),
            modifiedTimesStr = entries.map(o => {
                return JSON.stringify({
                    atime: o.stats.atime,
                    mtime: o.stats.mtime,
                    ctime: o.stats.ctime
                })
            }).join(' & '),
            pathStr = entries.map(o => o.path).join(' & '),
            hash1 = crypto.createHash('sha256').update(pathStr).digest('hex'),
            hash2 = crypto.createHash('sha256').update(modifiedTimesStr).digest('hex'),
            hash = crypto.createHash('sha256').update(`${hash1} & ${hash2}`).digest('hex')


        return { hash, size }

    }

    async __verify_binary_data(binaryObj) {
        validate("O", arguments);

        let hashObj = await this.__get_folder_file_hash(binaryObj.binary);


        return hashObj.size == binaryObj.size && hashObj.hash == binaryObj.hash;

    }

    async __save_binary_data(opt, dir) {
        validate("OS", arguments);

        let data = fs.existsSync(this.downloadedBinariesFile) ? fs.readJSONSync(this.downloadedBinariesFile) : {};

        data[opt.url] = Object.assign(
            await this.__get_folder_file_hash(dir), { binary: opt.binary }
        )

        fs.writeJSONSync(this.downloadedBinariesFile, data, { spaces: 4 });
    }

    async __binary_not_downloaded(opt) {
        validate("O", arguments);

        this.downloadedBinariesFile = path.join(this.binariesDir, "downloaded-binary.json")
        let downloadedBinaries = fs.existsSync(this.downloadedBinariesFile) ? fs.readJSONSync(this.downloadedBinariesFile) : {};
        // console.log({ downloadedBinariesFile, downloadedBinaries });

        let binaryVerified = (!opt.verifyBinary || await this.__verify_binary_data(downloadedBinaries[opt.url]));

        if (downloadedBinaries[opt.url] && binaryVerified) {
            this.whichBinary = downloadedBinaries[opt.url].binary;
            return false;
        }

        return true;
    }

    __targets_os(opt) {
        validate("O", arguments);

        let testPassed = true;

        let OS = this.__get_os();

        if (opt.os) {
            testPassed = (!opt.os.platform || opt.os.platform == OS.platform) && (!opt.os.arch || opt.os.arch == OS.arch);
        }

        this.os = OS;

        return testPassed;
    }

    __test_which(opt) {
        validate("O", arguments);

        let binary, toInstall = true;

        if (opt.which && "string" == typeof opt.which) {
            binary = which.sync(opt.which, { nothrow: true });
            if (binary == null) {
                toInstall = true;
            } else {
                toInstall = false;
                this.whichBinary = binary;
            }
        }


        return toInstall;
    }

    async __download(opt) {
        validate("O", arguments);

        // if valid url
        if (!opt.url || !isAbsoluteUrl(opt.url)) throw error(`URL is invalid or not entered!`);


        let ext = (opt.url.match(/\.(gzip|7z|bz2|gz|rar|tar|zip|xz|gz)(\..+)?$/) || [''])[0],
            tmpDir = os.tmpdir(),
            tmpFileName = Date.now().toString() + ext,
            tempDownloadPath = path.join(tmpDir, tmpFileName);

        // create directories for the download
        let URLObj = new URL(opt.url),
            name = opt.names || URLObj.pathname.split('/').pop().replace(/\..+$/, ''),
            dir = opt.dir || this.binariesDir;


        // ensure directory
        fs.ensureDirSync(dir);

        // add name to dir
        dir = path.join(dir, name);


        console.log('OS: ' + chalk.yellow(this.os.platform + ' - ' + '[' + this.os.arch + ']'));
        console.log(`Downloading binary from ${chalk.yellow(opt.url)}`);

        await download(opt.url, tmpDir, { filename: tmpFileName })
            .on('downloadProgress', function(progress) {
                progressBar.show(progress.percent)
            })
            .on('error', function(error) {
                throw error
            })


        // decompress
        if (fs.existsSync(tempDownloadPath)) {
            return { tempDownloadPath, dir };
        } else {
            throw new Error(`There was an Error downloading ${opt.url}`)
        }

    }

    async __make_single_level_binary(dir) {
        validate("S", arguments);

        let items = fs.readdirSync(dir),
            hasNoFiles = items.map(f => path.join(dir, f)).filter(f => fs.statSync(f).isFile()).length === 0;


        if (hasNoFiles && items.length == 1) {

            let thisDir = path.join(dir, items[0]),
                src, dest;

            items = fs.readdirSync(thisDir);

            for (let item of items) {
                src = path.join(thisDir, item);
                dest = path.join(dir, item);
                await moveFile(src, dest);
            }

            // console.log({ thisDir }, fs.existsSync(thisDir));
            rimraf.sync(thisDir);
        }

        return dir;
    }

    async __extract(tempDownloadPath, dir) {

        // remove directory if exists
        fs.existsSync(dir) && rimraf.sync(dir);

        return decompress(tempDownloadPath, dir, {})
            .then(files => {
                return this.__make_single_level_binary(dir);
            })
            .catch(err => {
                if (err.code == 'EEXIST') {
                    // delete dir...
                    let existingDir = path.join(dir, path.relative(dir, err.dest).split(path.sep).shift());

                    if (fs.existsSync(existingDir)) {
                        rimraf.sync(existingDir);
                        // deleted folder
                        return this.__extract(tempDownloadPath, dir);
                    }

                }

            })

    }

    __validate_opt(opt) {
        validate("O", arguments);

        if (!opt.url) throw new Error(`Url option must be provided!`)

        // validate name, which
        ['name', 'which', 'url', 'dir'].forEach(k => {
            if (opt[k] && "string" !== typeof opt[k])
                throw new Error(`The ${k} option must be a string. ${opt[k]} provided!`)
        })

        // validate os
        if (opt.os) {
            if ("object" !== typeof opt.os)
                throw new Error(`The os option must be an object. ${opt[k]} provided!`);

            if (['linux', 'windows', 'mac'].indexOf(opt.os.platform) == -1)
                throw new Error(`os.platform must be either "windows", "linux" or "mac". ${opt[k]} provided!`);
            if (opt.os.arch && "string" !== typeof opt.os.arch)
                throw new Error(`os.arch must be a string. ${opt[k]} provided!`);

        }

    }
}


class Getbinary extends Helper {

    constructor(opts) {
        os.homedir()
        super();
    }


    async get(binaryOpts) {

        binaryOpts = Array.isArray(binaryOpts) ? binaryOpts : [binaryOpts];

        let binaries = [];

        // loop thru
        for (let opt of binaryOpts) {

            // add some defaults
            opt = Object.assign({ verifyBinary: true }, opt);

            this.__validate_opt(opt);

            // filter binaries for this os
            if (this.__targets_os(opt)) {

                // do we need to install or is binary already installed?
                if (this.__test_which(opt) && await this.__binary_not_downloaded(opt)) {

                    // download
                    let { tempDownloadPath, dir } = await this.__download(opt);

                    // extract
                    this.binary = await this.__extract(tempDownloadPath, dir);

                    opt.binary = this.binary

                    // save data in this.downloadedBinariesFile
                    await this.__save_binary_data(opt, dir);

                } else {
                    opt.binary = this.whichBinary;
                }


                binaries.push(opt)


            }

        }


        return binaries;
    }





}







module.exports = new Getbinary