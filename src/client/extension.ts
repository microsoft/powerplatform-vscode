/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import * as vscode from "vscode";
import { ITelemetryData } from "../common/TelemetryData";
import { CliAcquisition } from "./lib/CliAcquisition";
import { PacTerminal } from "./lib/PacTerminal";
import { PortalWebView } from "./PortalWebView";

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    WorkspaceFolder,
} from "vscode-languageclient/node";
import {
    activateDebugger,
    deactivateDebugger,
    shouldEnableDebugger,
} from "../debugger";
import { handleFileSystemCallbacks } from "./power-pages/fileSystemCallbacks";
import { readUserSettings } from "./telemetry/localfileusersettings";
import { initializeGenerator } from "./power-pages/create/CreateCommandWrapper";
import { disposeDiagnostics } from "./power-pages/validationDiagnostics";
import { bootstrapDiff } from "./power-pages/bootstrapdiff/BootstrapDiff";
import { CopilotNotificationShown } from "../common/copilot/telemetry/telemetryConstants";
import { copilotNotificationPanel, disposeNotificationPanel } from "../common/copilot/welcome-notification/CopilotNotificationPanel";
import { COPILOT_NOTIFICATION_DISABLED, EXTENSION_VERSION_KEY } from "../common/copilot/constants";
import { oneDSLoggerWrapper } from "../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { OrgChangeNotifier, orgChangeErrorEvent, orgChangeEvent } from "./OrgChangeNotifier";
import { ActiveOrgOutput } from "./pac/PacTypes";
import { desktopTelemetryEventNames } from "../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames";
import { ArtemisService } from "../common/services/ArtemisService";
import { workspaceContainsPortalConfigFolder } from "../common/utilities/PathFinderUtil";
import { getPortalsOrgURLs } from "../common/utilities/WorkspaceInfoFinderUtil";
import { EXTENSION_ID, SUCCESS } from "../common/constants";
import { PowerPagesAppName, PowerPagesClientName } from "../common/ecs-features/constants";
import { ECSFeaturesClient } from "../common/ecs-features/ecsFeatureClient";
import { getECSOrgLocationValue, getWorkspaceFolders } from "../common/utilities/Utils";
import { CliAcquisitionContext } from "./lib/CliAcquisitionContext";
import { PreviewSite } from "./power-pages/preview-site/PreviewSite";
import { ActionsHub } from "./power-pages/actions-hub/ActionsHub";
import { extractAuthInfo, extractOrgInfo } from "./power-pages/commonUtility";
import PacContext from "./pac/PacContext";
import ArtemisContext from "./ArtemisContext";
import { RegisterBasicPanels, RegisterCopilotPanels } from "./lib/PacActivityBarUI";
import { PacWrapper } from "./pac/PacWrapper";
import { authenticateUserInVSCode } from "../common/services/AuthenticationProvider";
import { PROVIDER_ID } from "../common/services/Constants";
import { activateServerApiAutocomplete } from "../common/intellisense";
import { EnableServerLogicChanges } from "../common/ecs-features/ecsFeatureGates";
import { setServerApiTelemetryContext } from "../common/intellisense/ServerApiTelemetryContext";
import { MetadataDiffDesktop } from "./power-pages/metadata-diff/MetadataDiffDesktop";

let client: LanguageClient;
let _context: vscode.ExtensionContext;
let htmlServerRunning = false;
let yamlServerRunning = false;
let copilotPanelsRegistered = false;
let copilotPanelsDisposable: vscode.Disposable[] = [];
let serverApiAutocompleteInitialized = false;

export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    _context = context;

    // Logging telemetry in US cluster for unauthenticated scenario
    oneDSLoggerWrapper.instantiate("us");

    oneDSLoggerWrapper.getLogger().traceInfo("Start", {
        "pac.userId": readUserSettings().uniqueId
    });

    _context.subscriptions.push(
        vscode.authentication.onDidChangeSessions(async (event) => {
            if (event.provider.id === PROVIDER_ID) {
                await authenticateUserInVSCode(true);
            }
        })
    );

    // Setup context switches
    if (
        vscode.env.remoteName === undefined ||
        vscode.env.remoteName === "wsl"
    ) {
        // PAC Interactive Login works when we are the UI is running on the same machine
        // as the extension (i.e. NOT remote), or the remote is WSL
        vscode.commands.executeCommand(
            "setContext",
            "pacCLI.authPanel.interactiveLoginSupported",
            true
        );
    } else {
        _context.environmentVariableCollection.replace(
            "PAC_CLI_INTERACTIVE_AUTH_NOT_AVAILABLE",
            "true"
        );
    }

    await authenticateUserInVSCode(); //Authentication for extension

    // portal web view panel
    _context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.preview-show",
            () => {
                oneDSLoggerWrapper.getLogger().traceInfo("StartCommand", {
                    commandId: "microsoft-powerapps-portals.preview-show"
                });
                PortalWebView.createOrShow();
            }
        )
    );

    // registering bootstrapdiff command
    _context.subscriptions.push(
        vscode.commands.registerCommand('microsoft-powerapps-portals.bootstrap-diff', async () => {
            oneDSLoggerWrapper.getLogger().traceInfo("StartCommand", {
                commandId: "microsoft-powerapps-portals.bootstrap-diff",
            });
            bootstrapDiff();
        }
        )
    );

    _context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(() => {
            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (
                !isCurrentDocumentEdited() &&
                PortalWebView.checkDocumentIsHTML()
            ) {
                if (PortalWebView?.currentPanel) {
                    oneDSLoggerWrapper.getLogger().traceInfo("PortalWebPagePreview", {
                        page: "NewPage",
                    });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );
    _context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (isCurrentDocumentEdited()) {
                if (PortalWebView?.currentPanel) {
                    oneDSLoggerWrapper.getLogger().traceInfo("PortalWebPagePreview", {
                        page: "ExistingPage",
                    });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(PortalWebView.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
                PortalWebView.revive(webviewPanel);
            },
        });
    }

    // Add CRUD related callback subscription here
    await handleFileSystemCallbacks(_context);

    const cliContext = new CliAcquisitionContext(_context);
    const cli = new CliAcquisition(cliContext);
    const cliPath = await cli.ensureInstalled();
    const pacTerminal = new PacTerminal(_context, cliPath);
    _context.subscriptions.push(cli);
    _context.subscriptions.push(pacTerminal);

    // Register auth and env panels
    const pacWrapper = pacTerminal.getWrapper();
    const basicPanels = RegisterBasicPanels(pacWrapper);
    _context.subscriptions.push(...basicPanels);

    let copilotNotificationShown = false;

    const workspaceFolders = getWorkspaceFolders();

    // Init OrgChangeNotifier instance
    OrgChangeNotifier.createOrgChangeNotifierInstance(pacTerminal.getWrapper());

    _context.subscriptions.push(
        orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
            const orgID = orgDetails.OrgId;

            const [artemisResult, pacActiveAuthResult] = await Promise.allSettled([
                ArtemisService.getArtemisResponse(orgID, ""),
                pacTerminal.getWrapper()?.activeAuth()
            ]);

            const artemisResponse = artemisResult.status === 'fulfilled' ? artemisResult.value : null;
            const pacActiveAuth = pacActiveAuthResult.status === 'fulfilled' ? pacActiveAuthResult.value : null;

            if (artemisResponse !== null && artemisResponse.response !== null) {
                ArtemisContext.setContext(artemisResponse);

                const { geoName, geoLongName, clusterName, clusterNumber, environment } = artemisResponse.response;
                let AadObjectId, EnvID, TenantID;

                if ((pacActiveAuth && pacActiveAuth.Status === SUCCESS)) {
                    const authInfo = extractAuthInfo(pacActiveAuth.Results);
                    PacContext.setContext(authInfo, extractOrgInfo(orgDetails));

                    AadObjectId = authInfo.EntraIdObjectId;
                    EnvID = authInfo.EnvironmentId;
                    TenantID = authInfo.TenantId;
                }

                if (EnvID && TenantID && AadObjectId) {
                    // Initialize ECS features client
                    await ECSFeaturesClient.init(
                        {
                            AppName: PowerPagesAppName,
                            EnvID,
                            UserID: AadObjectId,
                            TenantID,
                            Region: artemisResponse.stamp,
                            Location: getECSOrgLocationValue(clusterName, clusterNumber)
                        },
                        PowerPagesClientName, true);

                    // Register copilot panels only after ECS initialization is complete
                    registerCopilotPanels(pacWrapper);

                    const { enableServerLogicChanges } = ECSFeaturesClient.getConfig(EnableServerLogicChanges);
                    if (!serverApiAutocompleteInitialized && enableServerLogicChanges) {
                        // Set telemetry context for Server API autocomplete events
                        setServerApiTelemetryContext({
                            tenantId: TenantID,
                            envId: EnvID,
                            userId: AadObjectId,
                            orgId: orgID,
                            geo: geoName,
                        });
                        activateServerApiAutocomplete(_context, [
                            { languageId: 'javascript', triggerCharacters: ['.'] }
                        ]);
                        serverApiAutocompleteInitialized = true;
                    }
                }

                oneDSLoggerWrapper.instantiate(geoName, geoLongName, environment);
                let initContext: object = { ...orgDetails, orgGeo: geoName };
                if (AadObjectId) {
                    initContext = { ...initContext, AadId: AadObjectId }
                }
                oneDSLoggerWrapper.getLogger().traceInfo(desktopTelemetryEventNames.DESKTOP_EXTENSION_INIT_CONTEXT, initContext);
            }

            if (!copilotNotificationShown && workspaceContainsPortalConfigFolder(workspaceFolders)) {
                let telemetryData = '';
                let listOfActivePortals = [];
                try {
                    listOfActivePortals = getPortalsOrgURLs(workspaceFolders);
                    telemetryData = JSON.stringify(listOfActivePortals);
                    oneDSLoggerWrapper.getLogger().traceInfo("VscodeDesktopUsage", { listOfActivePortals: telemetryData, countOfActivePortals: listOfActivePortals.length.toString() });
                } catch (exception) {
                    const exceptionError = exception as Error;
                    oneDSLoggerWrapper.getLogger().traceError(exceptionError.name, exceptionError.message, exceptionError, { eventName: 'VscodeDesktopUsage' });
                }

                // Show Copilot notification after ECS initialization and workspace check
                showNotificationForCopilot(telemetryData, listOfActivePortals.length.toString());
                copilotNotificationShown = true;

            }

            await Promise.allSettled([
                PreviewSite.initialize(context, workspaceFolders, pacTerminal),
                ActionsHub.initialize(context, pacTerminal)
            ]);

            // Initialize Metadata Diff after ActionsHub so that its root node can attach; gated by ECS
            try {
                // Dynamic import to avoid circular reference at top-level during tests
                const { EnableMetadataDiff } = await import("../common/ecs-features/ecsFeatureGates");
                const { enableMetadataDiff } = ECSFeaturesClient.getConfig(EnableMetadataDiff);
                if (enableMetadataDiff) {
                    await MetadataDiffDesktop.initialize(context, pacTerminal);
                } else {
                    vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiffEnabled", false);
                }
            } catch (e) {
                // Non-blocking – log minimal telemetry; avoid failing activation
                oneDSLoggerWrapper.getLogger().traceError("MetadataDiffInitSkipped", (e as Error).message, e as Error);
            }

            vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.environment.initialized', true);
        }),

        orgChangeErrorEvent(async () => {
            // Register copilot panels even if org change was unsuccessful
            registerCopilotPanels(pacWrapper);

            // Even if auth change was unsuccessful, we should still initialize the actions hub
            await ActionsHub.initialize(_context, pacTerminal);

            vscode.commands.executeCommand('setContext', 'microsoft.powerplatform.environment.initialized', true);
        })
    );

    if (workspaceContainsPortalConfigFolder(workspaceFolders)) {

        vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);
        vscode.workspace.textDocuments.forEach(didOpenTextDocument);

        oneDSLoggerWrapper.getLogger().traceInfo("PowerPagesWebsiteYmlExists");
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', true);
        initializeGenerator(_context, cliContext); // Showing the create command only if website.yml exists
    }
    else {
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', false);
    }

    const workspaceFolderWatcher = vscode.workspace.onDidChangeWorkspaceFolders(handleWorkspaceFolderChange);
    _context.subscriptions.push(workspaceFolderWatcher);

    if (shouldEnableDebugger()) {
        activateDebugger(context);
    }

    oneDSLoggerWrapper.getLogger().traceInfo("activated");
}

export async function deactivate(): Promise<void> {
    oneDSLoggerWrapper.getLogger().traceInfo("End");

    if (client) {
        await client.stop();
    }

    disposeDiagnostics();
    deactivateDebugger();
    disposeNotificationPanel();
}

function didOpenTextDocument(document: vscode.TextDocument): void {
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    if (document.languageId === "yaml" && !yamlServerRunning) {
        // The server is implemented in node
        const serverModule = _context.asAbsolutePath(
            path.join("dist", "yamlServer.js")
        );

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            },
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for yaml documents
            documentSelector: [{ scheme: "file", language: "yaml" }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents:
                    vscode.workspace.createFileSystemWatcher("**/.clientrc"),
            },
        };

        // Create the language client and start the client.
        client = new LanguageClient(
            "PowerappsYamlLanguageServer",
            "PowerApps Yaml Language Server",
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        const disposable = client.start();
        if (disposable) {
            yamlServerRunning = true;
            _context.subscriptions.push(disposable);
        }

        // this is used to send yamlServer telemetry events
        registerClientToReceiveNotifications(client);
    } else if (document.languageId === "html" && !htmlServerRunning) {
        // The server is implemented in node
        const serverModule = _context.asAbsolutePath(
            path.join("dist", "htmlServer.js")
        );
        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            },
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for yaml documents
            documentSelector: [{ scheme: "file", language: "html" }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents:
                    vscode.workspace.createFileSystemWatcher("**/.clientrc"),
            },
        };

        // Create the language client and start the client.
        client = new LanguageClient(
            "PowerappsHtmlLanguageServer",
            "PowerApps Html Language Server",
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        const disposable = client.start();
        if (disposable) {
            htmlServerRunning = true;
            _context.subscriptions.push(disposable);
        }

        // this is used to send HtmlServer telemetry events
        registerClientToReceiveNotifications(client);
    }
}

function registerClientToReceiveNotifications(client: LanguageClient) {
    client.onReady().then(() => {
        client.onNotification("telemetry/event", (payload: string) => {
            const serverTelemetry = JSON.parse(payload) as ITelemetryData;
            if (!!serverTelemetry && !!serverTelemetry.eventName) {
                oneDSLoggerWrapper.getLogger().traceInfo(
                    serverTelemetry.eventName,
                    serverTelemetry.properties,
                    serverTelemetry.measurements
                );
            }
        });
    });
}

function isCurrentDocumentEdited(): boolean {
    const workspaceFolderExists =
        vscode.workspace.workspaceFolders !== undefined;
    let currentPanelExists = false;
    if (PortalWebView?.currentPanel) {
        currentPanelExists = true;
    }
    return (
        workspaceFolderExists &&
        currentPanelExists &&
        PortalWebView.currentDocument ===
        vscode?.window?.activeTextEditor?.document?.fileName
    );
}

function handleWorkspaceFolderChange() {
    const workspaceFolders =
        vscode.workspace.workspaceFolders?.map(
            (fl) => ({ ...fl, uri: fl.uri.fsPath } as WorkspaceFolder)
        ) || [];
    if (workspaceContainsPortalConfigFolder(workspaceFolders)) {
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', true);
    }
    else {
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', false);
    }
}

function showNotificationForCopilot(telemetryData: string, countOfActivePortals: string) {
    if (vscode.workspace.getConfiguration('powerPlatform').get('experimental.copilotEnabled') === false) {
        return;
    }

    const currentVersion = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON.version;
    const storedVersion = _context.globalState.get(EXTENSION_VERSION_KEY);

    if (!storedVersion || storedVersion !== currentVersion) {
        // Show notification panel for the first load or after an update
        oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationShown, { listOfOrgs: telemetryData, countOfActivePortals });
        copilotNotificationPanel(_context, telemetryData, countOfActivePortals);

        // Update the stored version to the current version
        _context.globalState.update(EXTENSION_VERSION_KEY, currentVersion);
        return;
    }

    const isCopilotNotificationDisabled = _context.globalState.get(COPILOT_NOTIFICATION_DISABLED, false);

    if (!isCopilotNotificationDisabled) {
        oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationShown, { listOfOrgs: telemetryData, countOfActivePortals });
        copilotNotificationPanel(_context, telemetryData, countOfActivePortals);
    }

}

/**
 * Registers copilot panels if they haven't been registered yet
 * @param pacWrapper The PAC wrapper instance
 */
function registerCopilotPanels(pacWrapper: PacWrapper): void {
    if (!copilotPanelsRegistered) {
        // Dispose previous copilot panel registrations if they exist
        for (const disposable of copilotPanelsDisposable) {
            disposable.dispose();
        }
        copilotPanelsDisposable = [];

        // Use RegisterCopilotPanels to register all copilot-related panels
        copilotPanelsDisposable = RegisterCopilotPanels(pacWrapper, _context);
        _context.subscriptions.push(...copilotPanelsDisposable);
        copilotPanelsRegistered = true;
    }
}
