/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import axios from 'axios';
const API_KEY = 'YOUR_API_KEY'; // Replace with your API key

export async function generatePageCopy(prompt: string): Promise<string> {
  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      prompt,
      max_tokens: 50,
      model: "text-davinci-003",
      temperature: 0.5
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return response.data.choices[0].text;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return error;
  }
}
