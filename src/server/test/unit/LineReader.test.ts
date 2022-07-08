/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */

import { expect } from 'chai';
import {
  Range,
  TextDocument,
} from 'vscode-languageserver-textdocument';
import { getEditedLineContent } from '../../lib/LineReader';

describe('PortalManifestReader', () => {

  it('LineReader- test getEditedLineContent undefined textDocument ', () => {
    const manifest = getEditedLineContent(0, undefined);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq('');
  });

  it('LineReader- test getEditedLineContent null textDocument ', () => {
    const manifest = getEditedLineContent(0, null as unknown as TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq('');
  });

  it('LineReader- test getEditedLineContent for 1 line content(edited 1st line) ', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div>en</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(0, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("<div>en</div>");
  });

  it('LineReader- test getEditedLineContent for 1 line content(editing 2nd line index would give no edited line) ', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div>en</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(1, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("");
  });

  it('LineReader- test getEditedLineContent for 2 line content(edited 2nd line) ', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n<div>en</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(1, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("<div>en</div>");
  });

  it('LineReader- test getEditedLineContent for 3 line content (edited 2nd line)', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n<div>en</div>\n<div>entity</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(1, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("<div>en</div>");
  });

  it('LineReader- test getEditedLineContent for 5 line content (edited 4th line)', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;">testLin1</div>\n<div>testLin2</div>\n<div>testLin3</div>\n<div>testLin4</div>\n<div>testLin5</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(3, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("<div>testLin4</div>");
  });

  it('LineReader- test getEditedLineContent for 5 line content (edited 2nd line)', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;">testLin1</div>\n<div>testLin2</div>\n<div>testLin3</div>\n<div>testLin4</div>\n<div>testLin5</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(1, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("<div>testLin2</div>");
  });

  it('LineReader- test getEditedLineContent for 4 line content (edited 4th line)', () => {
    var TextDocument = {
      getText: function (range?: Range) { return '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;">testLin1</div>\n<div>testLin2</div>\n<div>testLin3</div>\n<div>testLin4</div>' }, range: 1, _content: '<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; padding: 8px; margin: 0px; text-align: center; min-height: auto;"></div>\n en',
      offsetAt: 1,
    } as unknown as TextDocument;
    const manifest = getEditedLineContent(3, TextDocument);
    expect(manifest).to.be.not.undefined;
    expect(manifest).eq("<div>testLin4</div>");
  });
});




