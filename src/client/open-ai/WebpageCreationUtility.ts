/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getApiResponse } from "./ApiClient";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendApiRequest(_prompt:string): Promise<void> {
  //replace with user prompt
  const prompt = "Create a about us page for coca-cola in html format";

  // response is in english
  const responseText = await getApiResponse(prompt);

  translateResponse(responseText);
}

export function translateResponse(responseText: string): void {
    //get portal languages
    const portalLanguages = ["French", "Hindi"];
    const pageCopyInMultiLanguages = [responseText];

    //translate response to all portal languages
    portalLanguages.forEach(async (language) => {
        pageCopyInMultiLanguages.push(await translate(responseText, language));
    });

    convertTextToHTML(pageCopyInMultiLanguages);
}

async function translate(text: string, language: string): Promise<string> {
    //translate text to language
    const prompt = `Translate the provided text into ${language}: ${text}`
    const response =  await getApiResponse(prompt);
    return response
}

function convertTextToHTML (pageCopyInMultiLanguages: string[]): void {
    //convert text to html
    const pageCopyHtml = pageCopyInMultiLanguages.map(text => text.replace(/(\r\n|\n|\r)/gm,""))
    const pageCopyString = pageCopyHtml.join(" adx_lang ");
    createAiWebpage(pageCopyString);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createAiWebpage(_pageCopyString: string):void {
    // call webpage creation command
}