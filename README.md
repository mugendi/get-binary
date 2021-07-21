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
This module is used to install and extract binaries required for your apps. 

Think of it as an automated way to ensure that your app has the right binaries to run effectively.

# How?

First install ```yarn add get-binary```;

Then start the process by passing the correct options to determine the right binary for each Operating system.


```javascript

    let getB = require("get-binary");


    let binaryOpts = [
        {
            which: 'ffplay',
            os: {
                platform: 'linux',
                arch: 'x64'
            },
            url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-64.zip',
           
           // optional parameter it is advisable not to use this option
            // dir:'your dir'
        }
    ]

    // now get the binaries
    getB.get(binaryOpts)
        .then((fetchedBinaries) => {
            console.log(fetchedBinaries);
            // all done use the fetchedBinaries.binary to determine where binary has been saved 
            // Then use it in your app as required
        })
        .catch(console.error)

```

This returns an array as follows:

```javascript

    [
        {
            which: 'ffplay',
            name: 'ffplay',
            os: { platform: 'linux', arch: 'x64' },
            url: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-64.zip',
            binary: '/usr/bin/ffplay'
        }
    ]


```

# Behind the scenes

The options object above indicates the following:
- That we should only attempt this installation if our operating system is **Linux** using the **64-bit processor architecture**.

    Note that you can leave out the **os key/object** and in that case, the binary will be installed on all OS platforms. This is important for cross platform binaries such as many Java based binaries.

- That we should first run ```which ffplay```. 
    - If ffplay has been previously installed, then we return the that path in the ```binary``` key.
    - If ffplay has not been installed, then we download it from the path provided, unzip it and return a path to the binary
    This would return ```javascript  binary:'/home/mugz/.node_binaries/ffplay'``` because get-binary usually uses the **/home** folder to store it's modules.

- The name provided is also used as the binary directory name.

- The module **saves** a list of all downloaded modules in a JSON file so that only one download is necessary.

- After download and extraction, a special hash is generated and saved. This hash is generated from a list of all file names and their stats (not content as that would lead to unpredictable execution files for large binaries). This hash is checked against the binary directory each time and if found to be different, then the binary is downloaded afresh. This check is important to avoid running binaries that may be corrupted for whatever reason.

- In the event that the binary untars into another directory, then the module tries to move the files to the base directory. 


# API

## get(Array:binaryOpts)

## Binary Options
Binary Options is always an array of binaries to download. Multiple binaries can be installed using this single array.

- **url :** (required) link from which to fetch the binary

- **name :** (optional) name of the binary. If one is provided, then *get-binary* attempts to extract one form the url. Example: Given ```https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v3.2/ffplay-3.2.2-linux-64.zip``` then the file name will be something like ***ffplay-3**. It is recommended that you always provide a name.

- **which :** (optional) command to be run with the which command to determine if binary is needed

- **os :** (optional) an object containing the ```platform``` and ```arch``` variations. If missing, then binary is downloaded for all operating systems.

- **dir :** (optional) the directory where your binaries should be installed. Unless you have very specific reasons, do not use this option. get-binary automatically uses **/home/.node_binaries** as a central location for all your binaries. This is a good thing so that all your projects can reuse the same binaries where possible instead of duplicating them across your apps.


## Sample Installation for multiple binaries


