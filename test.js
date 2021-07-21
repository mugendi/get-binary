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

let getB = require(".");


let binaryOpts = [{
        name: 'questdb',
        os: {
            platform: 'linux',
            arch: 'x64'
        },
        url: 'https://github.com/questdb/questdb/releases/download/6.0.4/questdb-6.0.4-rt-linux-amd64.tar.gz'
    },
    {
        which: 'ffplay',
        name: 'ffplay',
        os: {
            platform: 'linux',
            arch: 'x64'
        },
        url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-64.zip'
    },
    {
        which: 'ffplay',
        os: {
            platform: 'linux',
            arch: 'x32'
        },
        url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-32.zip'
    },
    {
        which: 'ffplay',
        os: {
            platform: 'windows',
            arch: 'x32'
        },
        url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.2.1/ffplay-4.2.1-win-32.zip'
    },
    {
        which: 'ffplay',
        os: {
            platform: 'windows',
            arch: 'x64'
        },
        url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.2.1/ffplay-4.2.1-win-64.zip'
    },
    {
        which: 'ffplay',
        os: {
            platform: 'mac',
            arch: 'x64'
        },
        url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.2.1/ffplay-4.2.1-osx-64.zip'
    }
]


getB.get(binaryOpts)
    .then((binaries) => {
        console.log(binaries)
    })
    .catch(console.error)