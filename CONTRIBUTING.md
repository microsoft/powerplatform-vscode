# Contributing

This project will welcome contributions and suggestions in the near future.

Once this project is ready to welcome contributions and suggestions:  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit <https://cla.opensource.microsoft.com>.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

## Setting Up Local Dev Environment

Windows, macOS or Linux:

- [Node.js LTS (currently v18)](https://nodejs.org/en/download/)
- gulp CLI: ```npm install -g gulp-cli```
- [git](https://git-scm.com/downloads)
- [VS Code](https://code.visualstudio.com/Download) or your different favorite editor
- recommended VSCode extensions:
  - [EditorConfig for VS Code (editorconfig.editorconfig)](https://github.com/editorconfig/editorconfig-vscode)
  - [ESLint (dbaeumer.vscode-eslint)](https://github.com/Microsoft/vscode-eslint)
  - [GitLens (eamodio.gitlens)](https://github.com/eamodio/vscode-gitlens)
  - [markdownlint (davidanson.vscode-markdownlint)](https://github.com/DavidAnson/vscode-markdownlint)
- TEMPORARY:
  - Create a PAT for the Azure DevOps org ```msazure``` with scope: package(read) and add it as local environment variable.
  ```Powershell
  [Environment]::SetEnvironmentVariable('AZ_DevOps_Read_PAT', '<yourPAT>', [EnvironmentVariableTarget]::User)
  ```

## Build and Run

Clone, restore modules, build and run:

```bash
git clone https://github.com/microsoft/powerplatform-vscode.git pp-vscode
cd pp-vscode
npm ci
gulp ci
```

Open the local repository as folder in VS Code. To locally debug the extension, select the "Launch VSCode Extension" from the run/debug configurations and hit <F5>
