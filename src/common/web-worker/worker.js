/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

function testWorker () {
    // eslint-disable-next-line no-undef
    self.addEventListener('message', function (event) {
        if (event.data.type === 'start') {
            const value = event.data.value;
            console.log('start', value);
            // Do something with the value
          }
    }
    );
}


testWorker();
