/* eslint-disable @typescript-eslint/no-var-requires */
/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { expect } from 'chai';
import * as nearley from 'nearley';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const grammar = require('../../Parser/liquidTagGrammar');

describe('LiquidGrammar', () => {


  //#region "Scenarios for Entity Form"

  it('test invalid attribute(entityform) in Liquid Expression', () => {
    try
    {
     parseLiquidTag("{% entityform class: 'test' %}");
    }
    catch(err)
    { 
      expect(err.message).eq('Error parsing the output');   
    }
   });

  it('test valid tag(entityform) in Liquid Expression', () => {
    const parsedTag = parseLiquidTag("{% entityform name: 'test' %}");
      expect(parsedTag).eq('entityform');
   });
 
   it('test valid index value(entityform with attribute name) in Liquid Expression', () => {
       const parserOutput = parseLiquidAndGetKeyValue("{% entityform name: 'test' %}");
       expect(parserOutput.size).eq(1);
       const liquidExpKeys = parserOutput.keys();
       expect(liquidExpKeys.next().value).eq('21');
       expect(parserOutput.get('21')).eq('name');
    });

    it('test valid index value(entityform with attribute ID) in Liquid Expression', () => {
      const parserOutput = parseLiquidAndGetKeyValue("{% entityform id: '1' %}");
      expect(parserOutput.size).eq(1);
      const liquidExpKeys = parserOutput.keys();
      expect(liquidExpKeys.next().value).eq('19');
      expect(parserOutput.get('19')).eq('id');
   });

    it('entityform- grammar should be unambiguous and output length should be 1 only', () => {
      const parserOutputLength = checkParsedOutputLength("{% entityform name: 'test' %}");
      expect(parserOutputLength).eq(1);
   });


  it('test valid index value(entityform with attribute name, id) in Liquid Expression', () => {
      const parserOutput = parseLiquidAndGetKeyValue("{% entityform name: 'test' id:'123' %}");
      expect(parserOutput.size).eq(2);
      const liquidExpKeys = parserOutput.keys();
      expect(liquidExpKeys.next().value).eq('21');
      expect(liquidExpKeys.next().value).eq('31');
      expect(parserOutput.get('21')).eq('name');
      expect(parserOutput.get('31')).eq('id');

   });

   it('test valid index value(entityform with attribute name, id, key) in Liquid Expression', () => {
    const parserOutput = parseLiquidAndGetKeyValue("{% entityform name: 'test' id:'123' key:'form1' %}");
    expect(parserOutput.size).eq(3);
    const liquidExpKeys = parserOutput.keys();
    expect(liquidExpKeys.next().value).eq('21');
    expect(liquidExpKeys.next().value).eq('31');
    expect(liquidExpKeys.next().value).eq('41');
    expect(parserOutput.get('21')).eq('name');
    expect(parserOutput.get('31')).eq('id');
    expect(parserOutput.get('41')).eq('key');

 });

 it('entityform( value contains spaces but still the index is same )', () => {
  const parserOutput = parseLiquidAndGetKeyValue("{% entityform name: '   test' %}");
  expect(parserOutput.size).eq(1);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('21');
  expect(parserOutput.get('21')).eq('name');
});

it('entityform( value enclosed in double/single quotes return same parsed output)', () => {
  const parserOutputWithDoubleQuotes = parseLiquidAndGetKeyValue('{% entityform name: "test" %}');
  const parserOutputWithSingleQuotes = parseLiquidAndGetKeyValue("{% entityform name: 'test' %}");
  const liquidExpKeysDouble = parserOutputWithDoubleQuotes.keys();
  const liquidExpKeysSingle = parserOutputWithSingleQuotes.keys();
  expect(liquidExpKeysDouble.next().value).eq('21');
  expect(liquidExpKeysSingle.next().value).eq('21');
  expect(parserOutputWithDoubleQuotes.get('21')).eq('name');
  expect(parserOutputWithSingleQuotes.get('21')).eq('name');
});

it('test valid index value(entityform with attribute name, id, key) in Liquid Expression(Comma separated)', () => {
  const parserOutput = parseLiquidAndGetKeyValue("{% entityform name: 'test',id:'123',key:'form1' %}");
  expect(parserOutput.size).eq(3);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('21');
  expect(liquidExpKeys.next().value).eq('31');
  expect(liquidExpKeys.next().value).eq('41');
  expect(parserOutput.get('21')).eq('name');
  expect(parserOutput.get('31')).eq('id');
  expect(parserOutput.get('41')).eq('key');

});

it('entityform(more spaces before/after tag definition  in liquid tag)- grammar should be unambiguous and output length should be 1 only', () => {
  const parserOutputLength = checkParsedOutputLength("{%  entityform name: 'test' id:'123' key:'form1' %}");
  expect(parserOutputLength).eq(1);
});

   //#endregion 

 //#region "Scenarios for Entity List"

 it('test valid tag(entitylist) in Liquid Expression', () => {
  const parsedTag = parseLiquidTag("{% include 'entity_list' key: '' %}");
    expect(parsedTag).eq('entity_list');
 });

 it('test valid index value(entitylist with attribute key) in Liquid Expression', () => {
     const parserOutput = parseLiquidAndGetKeyValue("{% include 'entity_list' key: 'list1' %}");
     expect(parserOutput.size).eq(1);
     const liquidExpKeys = parserOutput.keys();
     expect(liquidExpKeys.next().value).eq('31');
     expect(parserOutput.get('31')).eq('key');
  });

  it('entitylist- grammar should be unambiguous and output length should be 1 only', () => {
    const parserOutputLength = checkParsedOutputLength("{% include 'entity_list' key: 'list1' %}");
    expect(parserOutputLength).eq(1);
 });


it('test valid index value(entitylist with attribute key,name) in Liquid Expression', () => {
    const parserOutput = parseLiquidAndGetKeyValue("{% include 'entity_list' key: 'list1' name: 'test' %}");
    expect(parserOutput.size).eq(2);
    const liquidExpKeys = parserOutput.keys();
    expect(liquidExpKeys.next().value).eq('31');
    expect(liquidExpKeys.next().value).eq('45');
    expect(parserOutput.get('31')).eq('key');
    expect(parserOutput.get('45')).eq('name');

 });

 it('test valid index value(entitylist with attribute key,name, id) in Liquid Expression', () => {

  const parserOutput = parseLiquidAndGetKeyValue("{% include 'entity_list' key: 'list1' name: 'test' id: '123' %}");
  expect(parserOutput.size).eq(3);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('31');
  expect(liquidExpKeys.next().value).eq('45');
  expect(liquidExpKeys.next().value).eq('56');
  expect(parserOutput.get('31')).eq('key');
  expect(parserOutput.get('45')).eq('name');
  expect(parserOutput.get('56')).eq('id');

});

it('test valid index value(entitylist with attribute key,name, id) in Liquid Expression(Comma separated)', () => {
  const parserOutput = parseLiquidAndGetKeyValue("{% include 'entity_list' key: 'list1',name: 'test',id: '123' %}");
  expect(parserOutput.size).eq(3);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('31');
  expect(liquidExpKeys.next().value).eq('45');
  expect(liquidExpKeys.next().value).eq('56');
  expect(parserOutput.get('31')).eq('key');
  expect(parserOutput.get('45')).eq('name');
  expect(parserOutput.get('56')).eq('id');
});

it('entitylist( value contains spaces but still the index is same )', () => {
  const parserOutput = parseLiquidAndGetKeyValue("{% include 'entity_list' key: '     list1' %}");
  expect(parserOutput.size).eq(1);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('31');
  expect(parserOutput.get('31')).eq('key');
});

it('entitylist( value enclosed in double/single quotes return same parsed output)', () => {
  const parserOutputWithDoubleQuotes = parseLiquidAndGetKeyValue(`{% include 'entity_list' key: "list1" %}`);
  const parserOutputWithSingleQuotes = parseLiquidAndGetKeyValue("{% include 'entity_list' key: 'list1' %}");
  const liquidExpKeysDouble = parserOutputWithDoubleQuotes.keys();
  const liquidExpKeysSingle = parserOutputWithSingleQuotes.keys();
  expect(liquidExpKeysDouble.next().value).eq('31');
  expect(liquidExpKeysSingle.next().value).eq('31');
  expect(parserOutputWithDoubleQuotes.get('31')).eq('key');
  expect(parserOutputWithSingleQuotes.get('31')).eq('key');
});


 //#endregion 

 //#region "Scenarios for Web Form"

 it('test valid tag(webform) in Liquid Expression', () => {
  const parsedTag = parseLiquidTag("{% webform name: 'test' %}");
    expect(parsedTag).eq('webform');
 });

 it('test valid index value(webform with attribute name) in Liquid Expression', () => {
     const parserOutput = parseLiquidAndGetKeyValue("{% webform name: 'test' %}");
     expect(parserOutput.size).eq(1);
     const liquidExpKeys = parserOutput.keys();
     expect(liquidExpKeys.next().value).eq('18');
     expect(parserOutput.get('18')).eq('name');
  });

  it('test valid index value(webform with attribute id) in Liquid Expression', () => {
    const parserOutput = parseLiquidAndGetKeyValue("{% webform id: '1' %}");
    expect(parserOutput.size).eq(1);
    const liquidExpKeys = parserOutput.keys();
    expect(liquidExpKeys.next().value).eq('16');
    expect(parserOutput.get('16')).eq('id');
 });

  it('webform- grammar should be unambiguous and output length should be 1 only', () => {
    const parserOutputLength = checkParsedOutputLength("{% webform name: 'test' %}");
    expect(parserOutputLength).eq(1);
 });




it('test valid index value(webform with attribute name, id) in Liquid Expression', () => {
    const parserOutput = parseLiquidAndGetKeyValue("{% webform name: 'test' id: '123' %}");
    expect(parserOutput.size).eq(2);
    const liquidExpKeys = parserOutput.keys();
    expect(liquidExpKeys.next().value).eq('18');
    expect(liquidExpKeys.next().value).eq('29');
    expect(parserOutput.get('18')).eq('name');
    expect(parserOutput.get('29')).eq('id');

 });

 it('test valid index value(webform with attribute name, id, key) in Liquid Expression', () => {

  const parserOutput = parseLiquidAndGetKeyValue("{% webform name: 'test' id: '123' key: 'form1' %}");
  expect(parserOutput.size).eq(3);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('18');
  expect(liquidExpKeys.next().value).eq('29');
  expect(liquidExpKeys.next().value).eq('40');
  expect(parserOutput.get('18')).eq('name');
  expect(parserOutput.get('29')).eq('id');
  expect(parserOutput.get('40')).eq('key');

});

it('test valid index value(webform with attribute name, id, key) in Liquid Expression(Comma separated)', () => {
  const parserOutput = parseLiquidAndGetKeyValue("{% webform name: 'test',id: '123',key: 'form1' %}");
  expect(parserOutput.size).eq(3);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('18');
  expect(liquidExpKeys.next().value).eq('29');
  expect(liquidExpKeys.next().value).eq('40');
  expect(parserOutput.get('18')).eq('name');
  expect(parserOutput.get('29')).eq('id');
  expect(parserOutput.get('40')).eq('key');

});

it('webform( value contains spaces but still the index is same )', () => {
  const parserOutput = parseLiquidAndGetKeyValue("{% webform name: '     test ' %}");
  expect(parserOutput.size).eq(1);
  const liquidExpKeys = parserOutput.keys();
  expect(liquidExpKeys.next().value).eq('18');
  expect(parserOutput.get('18')).eq('name');
});

it('webform( value enclosed in double/single quotes return same parsed output)', () => {
  const parserOutputWithDoubleQuotes = parseLiquidAndGetKeyValue('{% webform name: "test" %}');
  const parserOutputWithSingleQuotes = parseLiquidAndGetKeyValue("{% webform name: 'test' %}");
  const liquidExpKeysDouble = parserOutputWithDoubleQuotes.keys();
  const liquidExpKeysSingle = parserOutputWithSingleQuotes.keys();
  expect(liquidExpKeysDouble.next().value).eq('18');
  expect(liquidExpKeysSingle.next().value).eq('18');
  expect(parserOutputWithDoubleQuotes.get('18')).eq('name');
  expect(parserOutputWithSingleQuotes.get('18')).eq('name');
});
 //#endregion 


});


function parseLiquidAndGetKeyValue(liquidExpression: string) {
  const parserOutput: Map<string, string> = new Map();
  // eslint-disable-next-line no-useless-catch
  try{
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(liquidExpression);

    for (const [key, value] of Object.entries(parser.results[0].map)) {
      parserOutput.set(`${key}` , `${value}`);
    }
  } 
   catch (err) {
    throw err;
  }
  return parserOutput;
}

function parseLiquidTag(liquidExpression: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try{
  // eslint-disable-next-line no-useless-catch
    parser.feed(liquidExpression);
  }
  catch(err)
  {
    throw new Error("Error parsing the output");
    
  }
  return parser.results[0].tag;
  
}

function checkParsedOutputLength(liquidExpression: string) {
  // eslint-disable-next-line no-useless-catch
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(liquidExpression);
  return parser.results.length;
}



