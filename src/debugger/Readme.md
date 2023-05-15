# Debugger for PCF controls

Adds a debugger option for PCF controls.
This works by attaching the edge debugger to a puppeteer session which opens a model driven app, intercepts network requests to the bundle and responds with the local version of the bundle.

## Setup

To use the debugger with any PCF control you need to perform the following steps:

1. **Enable Feature**: Make sure "_Power Platform -> Experimental: Enable Pcf Debugging Features_" is enabled. After enabling the feature, you need to restart vscode.

![Image of vscode settings page with debugger feature enabled](assets/debugger-enable-feature-flag.png)

2. **tsconfig source maps**: Open `tsconfig.json` and add `"sourceMap": true` under `compilerOptions`. Your file should look something like this:

  ```json
  {
      "extends": "./node_modules/pcf-scripts/tsconfig_base.json",
      "compilerOptions": {
          "sourceMap": true,
      }
  }
  ```

3. **Add custom webpack config**: To enable the custom webpack config feature flag you need to create a file called `featureconfig.json` in your project root. Use the following contents:

```json
{
    { "pcfAllowCustomWebpack": "on" }
}
```

4. **Generate source maps**: To generate source maps with webpack, create a new file called `webpack.config.js` in your project root. Use the following contents:

```js

const customConfig = {
  // watch: true, // uncomment this line to enable webpack watch mode
  devtool: "inline-source-map"
}
module.exports = customConfig;
```

5. **Add a launch config**: Create a new `launch.json` file under `.vscode`. If the folder `.vscode` does not yet exist, you can create it.
Click on "_Add Configuration..._" and select for "_Debug PCF Control_" from the dropdown. (If you can't find the entry the you might have to restart vscode.)

![Image of vscode launch config](assets/debugger-selecting-launch-config.png)

A configuration for the [Sample: TableControl](https://github.com/microsoft/PowerApps-Samples/tree/master/component-framework/TableControl) is listed below:

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "powerplatform-vscode.debug",
      "request": "launch",
      "name": "Launch Control",
      "url": "https://YOUR_ORG_URL.crm.dynamics.com/main.aspx",
      "webRoot": "${workspaceFolder}",
      "renderFullScreen": false,
      "controlName": "cc_SampleNamespace.TableControl",
      "file": "out/controls/TableControl/bundle.js",
      "tabName": "Sample Control Tab"
    }
  ]
}
```

Refer to the "Configuration" section of to learn more about the configuration options.

6. **Launch your control**: Go to "Run and Debug" (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>) and click on "_Launch Control_". This should now open a new browser instance which will navigate to the URL you provided in the launch configuration as `url`. This will likely trigger a login prompt. Provide your credentials to login. If the debugger has timed out waiting for the page to load you might have to restart the debugger. It should not prompt you to login again.<br>
Once the form page is loaded, the debugger will try to navigate to the tab the control is located on automatically.

## Configuration

* `name` The name of the debug configuration. This is displayed in the "Run and Debug" dropdown.
* `url`: The URL of the form page where the control is located. This needs to be the full, absolute URL to an entity record displayed on a form. The easiest way to obtain this URL is to visit a page that displays the control and copy the URL from the address bar. Example: `https://SOME_ORG.crm.dynamics.com/main.aspx?appid=00000000-0000-0000-0000-000000000000&pagetype=entityrecord&etn=account&id=00000000-0000-0000-0000-000000000000`
* `webRoot`: The path the the root of the control code. In most instances, this will be just `${workspaceFolder}` or empty. In case you have multiple controls in your workspace you may need to specify the path to the control root. Example: `${workspaceFolder}/MyControl`.
* `renderFullScreen`: It's possible to render controls full screen without any form context. Use `true` here to do this. In most instances, you'll want to leave this set to `false`.
* `controlName`: The name of the control including the namespace. Example: `cc_SampleNamespace.TableControl`.
* `file`: Relative path to the `bundle.js` file. You can execute `npm run build` to generate and locate this file. Example: `out/controls/YourControl/bundle.js`.
* `tabName`: The name of the tab the control is located on. The debugger will try to automatically select this tab.
