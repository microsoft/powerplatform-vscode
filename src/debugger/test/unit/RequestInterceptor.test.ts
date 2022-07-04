import { RequestInterceptor } from "../../RequestInterceptor";
import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import { HTTPRequest, Page } from "puppeteer-core";
import sinon from "sinon";
import * as mocha from "mocha";
import { BundleLoader } from "../../BundleLoader";
import { getWorkspaceFolder } from "../helpers";

suite("RequestInterceptor", () => {
    let instance: RequestInterceptor;
    let puppeteerPage: Page;
    const setRequestInterceptionSpy = sinon.spy();
    const workspace = getWorkspaceFolder();
    const mockBundleContents = "mock bundle contents";

    mocha.before(() => {
        sinon
            .stub(BundleLoader.prototype, "loadFileContents")
            .resolves(mockBundleContents);
    });

    mocha.beforeEach(() => {
        instance = new RequestInterceptor(
            "${workspaceFolder}/controls/my-control/out/controls/src/bundle.js",
            workspace,
            NoopTelemetryInstance
        );

        puppeteerPage = {
            setRequestInterception: setRequestInterceptionSpy,
            on: () => ({}),
        } as unknown as Page;

        setRequestInterceptionSpy.resetHistory();
    });

    mocha.describe("register", () => {
        test("should set setRequestInterception to true on register", async () => {
            await instance.register(puppeteerPage, () => undefined);
            sinon.assert.calledWith(setRequestInterceptionSpy, true);
        });

        test("should not register twice", async () => {
            await instance.register(puppeteerPage, () => undefined);
            await instance.register(puppeteerPage, () => undefined);
            sinon.assert.calledOnce(setRequestInterceptionSpy);
        });
    });

    mocha.describe("onRequest", () => {
        const doMockRequestForUrl = async (
            url: string,
            method: string,
            respondSpy: sinon.SinonSpy<any[], any>,
            continueSpy: sinon.SinonSpy<any[], any>,
            onRequestInterceptedSpy: sinon.SinonSpy<any[], any> = sinon.spy()
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
            const request = {
                method: () => method,
                url: () => url,
                respond: respondSpy,
                continue: continueSpy,
            } as unknown as HTTPRequest;

            onRequestCallback(request);
        };

        test("responds with local bundle if request for bundle", async () => {
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

        test("calls onRequestIntercepted on bundle interception", async () => {
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

        test("continues if not bundle", async () => {
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

        test("continues if not GET request", async () => {
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
