/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// Queue that returns Promises on dequeue, either already resolved if the item
// has already been enqueued, or still waiting if the item has not yet arrived.
export class BlockingQueue<T> {
    private readonly promiseQueue: Promise<T>[] = [];
    private readonly resolverQueue: ((t: T) => void)[] = [];

    private addPromiseResolverPair() {
        this.promiseQueue.push(
            new Promise(resolve => {this.resolverQueue.push(resolve); })
        );
    }

    enqueue(t: T) : void {
        // ensure that either a resolver is already queued, or generate a new pair
        if (!this.resolverQueue.length) {
            this.addPromiseResolverPair();
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const resolve = this.resolverQueue.shift()!;
        resolve(t);
    }

    dequeue() : Promise<T> {
        // ensure that either a promise is already queued, or generate a new pair
        if (!this.promiseQueue.length) {
            this.addPromiseResolverPair();
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const promise = this.promiseQueue.shift()!;
        return promise;
    }
}
