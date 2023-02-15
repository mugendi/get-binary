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

const logUpdate = require('log-update');


class ProgressBar {
    constructor(opts) {
        this.opts = Object.assign(
            {
                progressBar: '■',
                size: process.stdout.columns - ' [100.00%] '.length - 5,
                mantissa: 2,
            },
            opts
        );
    }

    show(pc) {

        logUpdate(
            `[` +
                this.opts.progressBar
                    .repeat(this.opts.size * pc )
                    .padEnd(this.opts.size) +
                (pc * 100).toFixed(2) +
                '%' +
                `]`
        );

        if (pc == 1) {
            logUpdate.done();
        }
    }

    simulate(duration, opts) {
        this.opts = Object.assign(this.opts, opts);

        let max = 100,
            val = 0,
            ticker = duration / max,
            interval,
            pc;

        interval = setInterval(() => {
            val++;
            pc = val / max;
            this.show(pc);
            if (val >= max) clearInterval(interval);
        }, ticker);
    }
}

module.exports = ProgressBar;
