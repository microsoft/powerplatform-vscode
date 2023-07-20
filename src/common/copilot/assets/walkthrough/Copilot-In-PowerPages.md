# Copilot in Power Pages

Copilot in Visual Studio Code helps you code using natural language chat interaction. In Power Pages, you work with site code that includes HTML, JS, or CSS code to make site customizations that are not currently supported in Power Pages low-code design studio. This Copilot chat experience assists Power Pages developers like you to write code by simply describing your expected code behavior using natural language. You can then refine the generated code and use it when customizing your site.

![Copilot Screen](./images/copilotImage.svg)

## Prerequisites

Review the [terms](https://go.microsoft.com/fwlink/?linkid=2189520) and [Responsible AI FAQ](https://go.microsoft.com/fwlink/?linkid=2240145) documents to understand usage and limitations of Copilot. Check the following requirements to start using Copilot in Power Pages:

- Ensure you have installed the latest Power Platform Tools extension.
- Open site root folder in Visual Studio Code.

  ![Demo Site Screen](./images/websiteselection.svg)
- Login to Power Pages Copilot with your Dataverse Environment credentials. (Expand this to include how to connect to different environment)  

## How to use Copilot to generate code

Copilot in Visual Studio Code is tuned to generate code for Power Pages sites, so its functionalities are limited to Power Pages site supported languages like HTML, JS, and CSS. The generated code from Copilot makes use of supported frameworks like bootstrap and jQuery.

1. In the Copilot chat, describe the code behavior you want using natural language. For example, code for form validation or Ajax calls using the Power Pages Web API.
1. Continue to refine your questions in the Copilot chat and iterate them till you’ve got what you need.  
1. Once you are happy with the generated code, you can easily copy and paste the code snippet or insert the code to Power Pages site and modify the code further.

Examples

- `Write code for Web API to fetch active contacts`
- `Write code in JavaScript to make sure that submitted value for phone number field is in valid format`

Note

- Copilot generated code might not have the correct names for tables or columns, so it’s recommended to verify these details before using the code.
- To generate more accurate code, make sure you open the file where you want to use the code. For example, open a Web Page where you want to add Web API code or Open Custom JavaScript file for forms where you want to add field validation.

![Demo File Screen](./images/contextpowerpages.svg)

To know more, see [Copilot in Power Pages documentation].

## Help us in improving this feature

In every response of the Copilot chat, click the feedback options, 👍if you like the response or 👎if you didn’t like it. Your feedback will greatly help improve the capabilities of this feature.

![Feedback Screen](./images/feedback.svg)
