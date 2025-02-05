/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { RequestInterceptor } from "../../RequestInterceptor";
import { HTTPRequest, Page } from "puppeteer-core";
import sinon from "sinon";
import { getMockBundleLoader, getRequest } from "../helpers";

describe("RequestInterceptor", () => {
    let instance: RequestInterceptor;
    let puppeteerPage: Page;
    const setRequestInterceptionSpy = sinon.spy();
    const mockBundleContents = "mock bundle contents";

    beforeEach(() => {
        instance = new RequestInterceptor(
            getMockBundleLoader(mockBundleContents)
        );

        puppeteerPage = {
            setRequestInterception: setRequestInterceptionSpy,
            on: () => ({}),
        } as unknown as Page;

        setRequestInterceptionSpy.resetHistory();
    });

    describe("register", () => {
        it("should set setRequestInterception to true on register", async () => {
            await instance.register(puppeteerPage, () => undefined);
            sinon.assert.calledWith(setRequestInterceptionSpy, true);
        });

        it("should not register twice", async () => {
            await instance.register(puppeteerPage, () => undefined);
            await instance.register(puppeteerPage, () => undefined);
            sinon.assert.calledOnce(setRequestInterceptionSpy);
        });
    });

    describe("onRequest", () => {
        const doMockRequestForUrl = async (
            url: string,
            method: string,
            respondSpy: sinon.SinonSpy<unknown[], unknown>,
            continueSpy: sinon.SinonSpy<unknown[], unknown>,
            onRequestInterceptedSpy: sinon.SinonSpy<unknown[], Promise<void>> = sinon.spy()
        ) => {
            let onRequestCallback: (request: HTTPRequest) => void = () =>
                undefined;
            puppeteerPage = {
                setRequestInterception: setRequestInterceptionSpy,
                on: (
                    eventName: string,
                    callback: (request: HTTPRequest) => void
                ) => {
                    onRequestCallback = callback;
                },
            } as unknown as Page;

            await instance.register(puppeteerPage, onRequestInterceptedSpy);
            const request = getRequest(url, method, respondSpy, continueSpy);

            onRequestCallback(request);
        };

        it("responds with local bundle if request for bundle", async () => {
            const requestRespondSpy = sinon.spy();
            const requestContinueSpy = sinon.spy();
            await doMockRequestForUrl(
                "https://someOrg.com/webresources/publisher.ControlName/bundle.js",
                "GET",
                requestRespondSpy,
                requestContinueSpy
            );

            sinon.assert.notCalled(requestContinueSpy);
            sinon.assert.calledWith(requestRespondSpy, {
                status: 200,
                body: mockBundleContents,
                contentType: "text/javascript",
            });
        });

        it("calls onRequestIntercepted on bundle interception", async () => {
            const requestInterceptedSpy = sinon.spy();
            await doMockRequestForUrl(
                "https://someOrg.com/webresources/publisher.ControlName/bundle.js",
                "GET",
                sinon.spy(),
                sinon.spy(),
                requestInterceptedSpy
            );

            sinon.assert.calledOnce(requestInterceptedSpy);
        });

        it("continues if not bundle", async () => {
            const requestRespondSpy = sinon.spy();
            const requestContinueSpy = sinon.spy();
            await doMockRequestForUrl(
                "https://someOrg.com/somethingElse",
                "GET",
                requestRespondSpy,
                requestContinueSpy
            );

            sinon.assert.notCalled(requestRespondSpy);
            sinon.assert.calledOnce(requestContinueSpy);
        });

        it("continues if not GET request", async () => {
            const requestRespondSpy = sinon.spy();
            const requestContinueSpy = sinon.spy();
            await doMockRequestForUrl(
                "https://someOrg.com/somethingElse",
                "POST",
                requestRespondSpy,
                requestContinueSpy
            );

            sinon.assert.notCalled(requestRespondSpy);
            sinon.assert.calledOnce(requestContinueSpy);
        });
    });
});
