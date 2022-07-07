/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { BlockingQueue } from "../../../common/utilities/BlockingQueue";

describe('BlockingQueue', () => {

    it('items enqueued prior to dequeue are resolved in correct order', async () => {
        const queue = new BlockingQueue<number>();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);
        queue.enqueue(4);
        queue.enqueue(5);
        expect(await queue.dequeue()).to.be.equal(1);
        expect(await queue.dequeue()).to.be.equal(2);
        expect(await queue.dequeue()).to.be.equal(3);
        expect(await queue.dequeue()).to.be.equal(4);
        expect(await queue.dequeue()).to.be.equal(5);
    });

    it('items dequeued prior to enqueue resolve when items are added', async () => {
        const queue = new BlockingQueue<number>();
        const prom1 = queue.dequeue();
        const prom2 = queue.dequeue();
        const prom3 = queue.dequeue();
        const prom4 = queue.dequeue();
        const prom5 = queue.dequeue();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);
        queue.enqueue(4);
        queue.enqueue(5);
        expect(await prom1).to.be.equal(1);
        expect(await prom2).to.be.equal(2);
        expect(await prom3).to.be.equal(3);
        expect(await prom4).to.be.equal(4);
        expect(await prom5).to.be.equal(5);
    });

    it('items enqueued by "another thread" dequeued in correct order', async () => {
        const sleep = (ms : number) => new Promise(resolve => setTimeout(resolve, ms));
        const queue = new BlockingQueue<number>();

        setTimeout(async () => {
            queue.enqueue(1);
            await sleep(1);
            queue.enqueue(2);
            await sleep(1);
            queue.enqueue(3);
        }, 5);

        expect(await queue.dequeue()).to.be.equal(1);
        expect(await queue.dequeue()).to.be.equal(2);
        expect(await queue.dequeue()).to.be.equal(3);
    });
});
