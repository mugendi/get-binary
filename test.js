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
const path = require('path');
let getB = require('.');

const binariesDir = path.join(os.homedir(), 'binaries');

let binaryOpts = [
    {
        name: 'questdb',
        os: {
            platform: 'linux',
            arch: 'x64',
        },
        remote: {
            url: 'https://github.com/questdb/questdb/releases/download/6.0.4/questdb-6.0.4-rt-linux-amd64.tar.gz',
        },
        local: {
            // only runs from a local dir so no which command
            whichCmd: null,
            dir: binariesDir,
            name: 'questdb',
        },
    },
    {
        name: 'ffplay',
        os: {
            platform: 'linux',
            arch: 'x64',
        },
        remote: {
            url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-64.zip',
        },
        local: {
            whichCmd: ['ffmpeg'],
            dir: binariesDir,
            name: 'ffplay',
        },
    },
   
];

getB.get(binaryOpts)
    .then((binaries) => {
        console.log(binaries);
    })
    .catch(console.error);
