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

const os = require('os');
const { is_object, arrify, download_file } = require('./lib/utils');
const isAbsoluteUrl = require('is-absolute-url');
const path = require('path');
const fs = require('fs-extra');
const which = require('which');
const logger = require('debug-symbols')('get-binary');

const thisSystem = {
    platform: os.platform(),
    arch: os.arch(),
};

class Getbinary {
    constructor() {}

    async get(binaries, forceFetch = false) {
        try {
            this.forceFetch = forceFetch;

            // filter binaries for this os
            const supportedBinaries = this.#supported_binaries(binaries);

            // we use all settled so that one binary failing, such as download link being unavailable does not break others
            let resp = await Promise.allSettled(
                //
                supportedBinaries.map(async (opts) => {
                    let resp = await this.#download_binary(opts);
                    // console.log(opts);
                    return { [opts.name]: resp };
                })
            );

            // filter and format response
            const binariesFound = resp
                .filter(settled_promise)
                .map((o) => o.value)
                .reduce((a, b) => Object.assign(a, b), {});

            const errors = resp
                .filter((o) => o.status == 'rejected')
                .map((o) => o.reason.message);

            return { binaries: binariesFound, errors };
        } catch (error) {
            throw error;
        }
    }

    #supported_binaries(binaries) {
        const binariesArr = arrify(binaries).filter((b) => {
            // if os key is missing, assume is supported
            if ('os' in b === false) return true;

            //
            return (
                String(b.os?.arch).toLowerCase() == thisSystem.arch &&
                String(b.os?.platform).toLowerCase() == thisSystem.platform
            );
        });

        //
        return binariesArr;
        // console.log(thisSystem);
    }

    async #download_binary(binaryOpts) {
        try {
            // opts must be an object
            if (!is_object(binaryOpts)) {
                err(`Binary Opts must be an object`);
            }

            // validate options
            // 1. Binary must have a name
            if ('name' in binaryOpts === false) {
                err(`Binary Opts must include a name field`);
            }

            // 2. must have a valid url
            if (
                !binaryOpts.remote?.url ||
                !isAbsoluteUrl(binaryOpts.remote?.url)
            ) {
                err(
                    `Binary ${binaryOpts.name} does not have a valid remote.url!`
                );
            }

            //3. check dir && dir & name
            if (
                // no directory
                !binaryOpts.local?.dir ||
                // or directory value is not a string
                'string' !== typeof binaryOpts.local.dir ||
                // or no binary name
                !binaryOpts.local?.name ||
                // or binary name is not a string
                'string' !== typeof binaryOpts.local.name
            ) {
                err(
                    `Binary ${binaryOpts.name} must have valid 'local.dir' and 'local.name' options or a 'local.whichCmd' option`
                );
            }

            logger.debug('Ready to start...');

            // console.log(binaryOpts);
            // check if binary exists
            let { binaryExists, binaryPath } = await this.#binary_exists(
                binaryOpts
            );

            if (!binaryExists) {
                // if binary does not exist, we must download it now...
                binaryPath = await this.#get_binary(binaryOpts);
            } else {
                logger.debug('This binary already exists!');
            }

            // console.log({ binaryPath });
            // return path
            return binaryPath;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // downloads & unzips binary
    async #get_binary(binaryOpts) {
        try {
            let url = binaryOpts.remote.url;

            console.log(`> Downloading ${binaryOpts.name} from ${url}...`);

            await download_file(url, this.binaryFilePath);

            if (fs.existsSync(this.binaryFilePath)) {
                // move files to top dir
                let items = fs.readdirSync(this.binaryFilePath),
                    hasNoFiles =
                        items
                            .map((f) => path.join(this.binaryFilePath, f))
                            .filter((f) => fs.statSync(f).isFile()).length ===
                        0;

                if (hasNoFiles && items.length == 1) {
                    let thisDir = path.join(this.binaryFilePath, items[0]),
                        src,
                        dest;

                    items = fs.readdirSync(thisDir).forEach((f) => {
                        src = path.join(thisDir, f);
                        dest = path.join(this.binaryFilePath, f);
                        // move file
                        fs.moveSync(src, dest);
                    });

                    // delete old dir
                    fs.rmdirSync(thisDir);
                }
            }

            return [this.binaryFilePath];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // check if binary exists
    // We do so by looking at the path options and/or the which command
    async #binary_exists(binaryOpts) {
        try {
            const { whichCmd, dir, name } = binaryOpts.local;
            let binaryPath = null;

            // if which command
            if (whichCmd) {
                binaryPath = await Promise.allSettled(
                    arrify(whichCmd).map(
                        async (cmd) => await which(cmd, { nothrow: true })
                    )
                );

                // filter fulfilled values
                binaryPath = binaryPath
                    .filter(settled_promise)
                    .map((o) => o.value);
            }

            // ir no binary path and we have been provided with path details...
            //  some binaries could both be installed or run from a path...
            if ((!binaryPath || binaryPath.length === 0) && dir && name) {
                // first ensure dir given is an absolute dir
                if (!path.isAbsolute(dir)) {
                    err(
                        `Directory path entered "${dir} is not an absolute path.`
                    );
                }

                // if force download is set
                if (this.forceFetch) {
                    await fs.emptyDir(dir);
                }

                // ok proceed then
                let binaryFilePath = path.join(dir, name);

                // save this path for later
                this.binaryFilePath = binaryFilePath;
                this.binaryDir = dir;

                //
                if (fs.existsSync(binaryFilePath)) {
                    binaryPath = [binaryFilePath];
                }
            }

            return {
                binaryExists:
                    binaryPath && binaryPath.length > 0 ? true : false,
                binaryPath,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

function settled_promise(o) {
    return o.status == 'fulfilled' && o.value;
}

function err(err) {
    throw new Error(err);
}

module.exports = new Getbinary();
