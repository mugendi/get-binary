<!--
 Copyright 2021 Anthony Mugendi

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

# What?

This module is used to **fetch** and **extract** binaries required for your apps, where no supported binaries are found to be installed or previously downloaded.

# Why?
I wrote this module at a time when I was building an app that relies on [QuestDB](https://questdb.io/). I needed to be able to deploy the app without having to worry about the existence or lack thereof of **QuestDB** binaries.

# How?

First install `yarn add get-binary`;

Then start the process by passing the correct options to determine the right binary for each Operating system.

```javascript
const getB = require('get-binary');

const requiredBinaries = [
    {
        // required
        name: 'FFMPEG',
        // the os variant to target
        os: {
            platform: 'linux',
            arch: 'x64',
        },
        // remote URL to get binary from
        remote: {
            url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-64.zip',
        },
        // Local values
        local: {
            // the command to run in order to check if the binary is already installed
            // this is run using the "which" command
            whichCmd: ['ffmpeg'],
            // directory to save the binary
            dir: '/path/to/save/binaries',
            // name of the binary
            name: 'ffmpeg',
        },
    },
    {
        name: 'FFMPEG',
        os: {
            platform: 'windows',
            arch: 'x64',
        },
        remote: {
            url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.2.1/ffplay-4.2.1-win-64.zip',
        },
        local: {
            whichCmd: ['ffmpeg'],
            dir: '/path/to/save/binaries',
            name: 'ffmpeg',
        },
    },
    //{...other os variants or binaries}
];

// now get the binaries
getB.get(requiredBinaries)
    .then((fetchedBinaries) => {
        // all binaries fetched....
        console.log(fetchedBinaries);
    })
    .catch(console.error);
```

## How it works

-   The array of required binaries is filtered using `platform` and `arch` values returned by the [os](https://nodejs.org/api/os.html) module.
    -   If the `.os` key is missing, then the binary is assumed to match all operating systems. Omitting this key is the way to deal with cross-platform binaries.
-   Every matched binary is downloaded if:
    -   The `whichCmd` is missing or when run using [which](https://www.npmjs.com/package/which), does not find any installed binaries and...
    -   ...no downloaded binary is found at the path given by `local.dir/local.name`
-   An array of all binaries already existing, or freshly downloaded is returned...

In the example above, the following binaries are returned for my case:

```javascript
{ 
    binaries: { FFMPEG: [ '/usr/bin/ffmpeg' ] }, 
    errors: [] 
}
```

This is because I already have `ffmpeg` installed and the `which` command returns the installation path.

Otherwise, the binary would have been downloaded, unzipped and the path to the freshly unzipped files returned.


# API

## **`getB.get(requiredBinaries, [forceFetch])`**

Returns an object of binaries (already installed or downloaded) as indicated for that operating system, and an array or all errors encountered.

### **requiredBinaries**
Type: `Array` <br/>
This argument should be an array containing details for each binary to be installed on the specific operating system.

#### **Binary Details**


| Property | Description                                                                                                                                             | Required |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **name**     | `String`<br/> The name of the binary. It is also the name of the binary returned. Example: `{ FFMPEG: [ '/usr/bin/ffmpeg' ] }` where **FFMPEG** was the name entered. | Yes     |
|      **os**    | `Object`<br/> Holds details about the operating system that the binary is intended for. This Object should contain `platform` and `arch` keys. Example: `{platform: 'windows', arch:   |    No      |
|   **remote**  | `Object`<br/>   Details of where to download the binary from. The object must have a `url` key which must be a valid URL. |    Yes      |
| **local**| `Object`<br/> Details of where to download the binary to. The object must contain a `dir` and `name`. Values of `dir` and `name` must combine (using `path.join()`) to form a valid path on your machine or else creating binary directories will fail. |  Yes |

### **forceFetch**
Type: `Boolean` <br/>
If true, then a new binary is always downloaded irrespective of whether `whichCmd` finds an installed binary or one was previously downloaded. If a binary had already been downloaded, then all files will be replaced.

This option is useful if you want to force you app to download the latest binaries.


## Sample Installation for multiple binaries

Have a look at this [test file](./test.js) for a good example on how to get multiple binaries across different platforms.
