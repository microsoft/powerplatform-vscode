/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { expect } from "chai";
import Sinon from "sinon";
import { PORTAL_FILTERS, PORTAL_OBJECTS } from "../../constants/AutoComplete";
import { PortalEntityNames } from "../../constants/PortalEnums";
import * as LineReader from "../../lib/LineReader";
import { getSuggestions, initLiquidRuleEngine } from "../../lib/LiquidAutoCompleteRuleEngine";
import * as ManifestReader from "../../lib/PortalManifestReader";
import * as ServerTelemetry from "../../telemetry/ServerTelemetry";

let getMatchedManifestRecords: any;
let getEditedLineContent: any;
let sendTelemetryEvent: any

const suggestionTestUtil = (inputLine: string, mockManifestRecords: ManifestReader.IManifestElement[], mockCompletionItems: any, entityName: PortalEntityNames) => {
    const colIndex = inputLine.indexOf('_X_')

    getMatchedManifestRecords.returns(mockManifestRecords)
    getEditedLineContent.returns(inputLine.replace('_X_', ''))

    const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

    Sinon.assert.calledOnce(getEditedLineContent)
    Sinon.assert.calledWith(getMatchedManifestRecords, [], entityName, 'path')

    expect(completionItems).deep.equal(mockCompletionItems)
}


describe('LiquidAutoCompleteRuleEngine', () => {

    before(() => {
        initLiquidRuleEngine()
        sendTelemetryEvent = Sinon.stub(ServerTelemetry, "sendTelemetryEvent")
    })

    after(() => {
        sendTelemetryEvent.restore()
    })

    beforeEach(() => {
        getMatchedManifestRecords = Sinon.stub(ManifestReader, "getMatchedManifestRecords")
        getEditedLineContent = Sinon.stub(LineReader, "getEditedLineContent")
    });

    afterEach(() => {
        getMatchedManifestRecords.restore();
        getEditedLineContent.restore();
    });

    it('include tag auto complete', () => {

        const inputLine = '{% include _X_ %}'
        const mockManifestRecords = [{ DisplayName: "Sample Web Template", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Web Template", insertText: "'Sample Web Template'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.WEB_TEMPLATE);
    })

    it('include tag partial match auto complete', () => {

        const inputLine = `{% include 'abc_X_' %}`
        const mockManifestRecords = [{ DisplayName: "Sample Web Template", RecordId: "SampleID1" }, { DisplayName: "abcd", RecordId: "SampleID2" }]
        const mockCompletionItems = [{ label: "abcd", insertText: "abcd", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.WEB_TEMPLATE);
    })

    it('include snippet tag auto complete', () => {

        const inputLine = `{% include 'snippet' snippet_name:_X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Web Template", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Web Template", insertText: "'Sample Web Template'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.CONTENT_SNIPPET);
    })

    it('include entity_list tag auto complete', () => {

        const inputLine = `{% include 'entity_list' key:_X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Web Template", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Web Template", insertText: "'Sample Web Template'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.ENTITY_LIST);
    })

    it('editable tag identifier auto complete', () => {

        const inputLine = `{% editable _X_ %}`
        const mockCompletionItems = [
            {
                insertText: "page",
                kind: 12,
                label: "page",
            },
            {
                insertText: "snippets",
                kind: 12,
                label: "snippets",
            },
            {
                insertText: "weblinks",
                kind: 12,
                label: "weblinks"
            }
        ]

        getEditedLineContent.returns(inputLine)
        const colIndex = inputLine.indexOf('_X_')

        const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

        Sinon.assert.calledOnce(getEditedLineContent);
        expect(completionItems).deep.equal(mockCompletionItems);

    })

    it('editable tag attribute auto complete', () => {

        const inputLine = `{% editable page 'adx_copy' _X_ %}`
        const mockCompletionItems = [
            { label: 'class', insertText: 'class:', kind: 12 },
            { label: 'default', insertText: 'default:', kind: 12 },
            { label: 'escape', insertText: 'escape:', kind: 12 },
            { label: 'liquid', insertText: 'liquid:', kind: 12 },
            { label: 'tag', insertText: 'tag:', kind: 12 },
            { label: 'title', insertText: 'title:', kind: 12 },
            { label: 'type', insertText: 'type:', kind: 12 },
        ];

        getEditedLineContent.returns(inputLine)
        const colIndex = inputLine.indexOf('_X_')

        const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

        Sinon.assert.calledOnce(getEditedLineContent);
        expect(completionItems).deep.equal(mockCompletionItems);

    })

    it('editable snippets auto complete', () => {

        const inputLine = `{% editable snippets _X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Content Snippet", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Content Snippet", insertText: "'Sample Content Snippet'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.CONTENT_SNIPPET);

    })

    it('editable page auto complete', () => {

        const inputLine = `{% editable page _X_ %}`
        const mockCompletionItems = [
            { label: 'adx_copy', insertText: 'adx_copy', kind: 12 },
            { label: 'adx_summary', insertText: 'adx_summary', kind: 12 },
            { label: 'adx_title', insertText: 'adx_title', kind: 12 },
            { label: 'adx_partialurl', insertText: 'adx_partialurl', kind: 12 },
        ];

        getEditedLineContent.returns(inputLine)
        const colIndex = inputLine.indexOf('_X_')

        const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

        Sinon.assert.calledOnce(getEditedLineContent);
        expect(completionItems).deep.equal(mockCompletionItems);

    })

    it('entityform tag by name auto complete', () => {

        const inputLine = `{% entityform name:_X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Form", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Form", insertText: "'Sample Form'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.ENTITY_FORM);

    })

    it('entityform tag by id auto complete', () => {

        const inputLine = `{% entityform id:_X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Form", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Form", insertText: "'SampleID'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.ENTITY_FORM);

    })

    it('webform tag by name auto complete', () => {

        const inputLine = `{% webform name:_X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Form", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Form", insertText: "'Sample Form'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.WEBFORM);

    })

    it('webform tag by id auto complete', () => {

        const inputLine = `{% webform id:_X_ %}`
        const mockManifestRecords = [{ DisplayName: "Sample Form", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Form", insertText: "'SampleID'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.WEBFORM);

    })

    it('entityform tag attribute auto complete', () => {

        const inputLine = `{% entityform _X_ %}`
        const mockCompletionItems = [
            { label: 'id', insertText: 'id:', kind: 12 },
            { label: 'name', insertText: 'name:', kind: 12 },
            { label: 'key', insertText: 'key:', kind: 12 },
            { label: 'language_code', insertText: 'language_code:', kind: 12 },
        ];

        getEditedLineContent.returns(inputLine)
        const colIndex = inputLine.indexOf('_X_')

        const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

        Sinon.assert.calledOnce(getEditedLineContent);
        expect(completionItems).deep.equal(mockCompletionItems);

    })

    it('snippets object auto complete', () => {

        const inputLine = `{{ snippets[_X_] }}`
        const mockManifestRecords = [{ DisplayName: "Sample Name", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Name", insertText: "'Sample Name'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.CONTENT_SNIPPET);

    })

    it('settings object auto complete', () => {

        const inputLine = `{{ settings[_X_] }}`
        const mockManifestRecords = [{ DisplayName: "Sample Name", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Name", insertText: "'Sample Name'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.SITE_SETTING);

    })

    it('weblinks object auto complete', () => {

        const inputLine = `{{ weblinks[_X_] }}`
        const mockManifestRecords = [{ DisplayName: "Sample Name", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Name", insertText: "'Sample Name'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.WEBLINK_SET);

    })

    it('sitemarker object auto complete', () => {

        const inputLine = `{{ sitemarker[_X_] }}`
        const mockManifestRecords = [{ DisplayName: "Sample Name", RecordId: "SampleID" }]
        const mockCompletionItems = [{ label: "Sample Name", insertText: "'Sample Name'", kind: 12 }]

        suggestionTestUtil(inputLine, mockManifestRecords, mockCompletionItems, PortalEntityNames.SITE_MARKER);

    })

    it('portal filters in tag auto complete', () => {

        const inputLine = `{% assign redmond = entityview.records | _X_ %}`

        const mockCompletionItems = PORTAL_FILTERS.map(filter => { return { label: filter, insertText: filter, kind: 12 } })

        getEditedLineContent.returns(inputLine)
        const colIndex = inputLine.indexOf('_X_')

        const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

        Sinon.assert.calledOnce(getEditedLineContent);
        expect(completionItems).deep.equal(mockCompletionItems);
    })

    it('portal filters in output auto complete', () => {

        const inputLine = `{{ group1 | concat: group2 | _X_ }}`
        const mockCompletionItems = PORTAL_OBJECTS.concat(PORTAL_FILTERS).map(filter => { return { label: filter, insertText: filter, kind: 12 } })

        getEditedLineContent.returns(inputLine)
        const colIndex = inputLine.indexOf('_X_')

        const completionItems = getSuggestions(1, colIndex, 'path', [], {} as any, {} as any)

        Sinon.assert.calledOnce(getEditedLineContent);
        expect(completionItems).deep.equal(mockCompletionItems);

    })
})
