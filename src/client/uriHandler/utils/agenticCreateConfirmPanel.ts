/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getNonce } from "../../../common/utilities/Utils";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { PlannedCommand } from "./agentHostCommandPlan";

/**
 * The user's decision at the confirmation gate.
 * - `start`     run the previewed command plan.
 * - `cancel`    explicitly abandon the flow.
 * - `dismissed` the panel was closed without a choice (possibly accidental).
 */
export type ConfirmDecision = "start" | "cancel" | "dismissed";

/**
 * Side effects used by {@link showAgenticCreateConfirmPanel}. Injected so the panel can be tested
 * with a fake webview panel.
 */
export interface ShowConfirmPanelDependencies {
    createWebviewPanel: (
        viewType: string,
        title: string,
        showOptions: vscode.ViewColumn,
        options: vscode.WebviewPanelOptions & vscode.WebviewOptions
    ) => vscode.WebviewPanel;
}

const DEFAULT_CONFIRM_PANEL_DEPENDENCIES: ShowConfirmPanelDependencies = {
    createWebviewPanel: (viewType, title, showOptions, options) =>
        vscode.window.createWebviewPanel(viewType, title, showOptions, options)
};

/**
 * Escapes a string for safe interpolation into HTML text/attribute content. Folder paths and
 * command lines are the only interpolated values and are not fully trusted, so they are escaped
 * to prevent breaking out of the markup.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Substitutes a single positional argument into a localized `{0}` template.
 */
function formatTemplate(template: string, value: string): string {
    return template.split("{0}").join(value);
}

/**
 * Builds the full HTML document for the confirmation panel. All styling uses VS Code theme CSS
 * variables so it honors the active theme (including high-contrast), and a strict CSP with a
 * per-render nonce gates the single inline style block and inline script.
 */
function buildHtml(hostDisplayName: string, folderPath: string, plan: PlannedCommand[]): string {
    const nonce = getNonce();
    const confirm = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM;
    const title = formatTemplate(confirm.TITLE, hostDisplayName);

    const commandItems = plan
        .map(
            (command, index) => `
            <li class="command">
                <div class="command-desc">${index + 1}. ${escapeHtml(command.description)}</div>
                <code class="command-line">${escapeHtml(command.commandLine)}</code>
            </li>`
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="${escapeHtml(vscode.env.language)}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style nonce="${nonce}">
        body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 0 24px 24px; max-width: 820px; }
        h1 { font-size: 1.3em; font-weight: 600; margin-bottom: 0.3em; }
        .description { color: var(--vscode-descriptionForeground); margin-top: 0; margin-bottom: 1.4em; }
        h2.section-header { text-transform: uppercase; font-size: 0.72em; font-weight: 700; letter-spacing: 0.08em; color: var(--vscode-descriptionForeground); margin: 1.6em 0 0.6em; }
        dl.summary { display: grid; grid-template-columns: max-content 1fr; gap: 6px 20px; margin: 0; }
        dl.summary dt { color: var(--vscode-descriptionForeground); }
        dl.summary dd { margin: 0; word-break: break-all; }
        ol.commands { list-style: none; margin: 0; padding: 0; }
        li.command { margin-bottom: 1em; }
        .command-desc { margin-bottom: 4px; }
        code.command-line { display: block; font-family: var(--vscode-editor-font-family, monospace); font-size: 0.9em; background: var(--vscode-textCodeBlock-background); padding: 7px 11px; border-radius: 4px; white-space: pre-wrap; word-break: break-all; }
        .actions { display: flex; gap: 10px; margin-top: 2em; flex-wrap: wrap; }
        button { font-family: inherit; font-size: 0.95em; padding: 7px 18px; border: 1px solid transparent; border-radius: 2px; cursor: pointer; }
        button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
        button.primary:hover { background: var(--vscode-button-hoverBackground); }
        button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
        button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
        button:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <p class="description">${escapeHtml(confirm.DESCRIPTION)}</p>

    <h2 class="section-header">${escapeHtml(confirm.SUMMARY_HEADER)}</h2>
    <dl class="summary">
        <dt>${escapeHtml(confirm.HOST_LABEL)}</dt><dd>${escapeHtml(hostDisplayName)}</dd>
        <dt>${escapeHtml(confirm.FOLDER_LABEL)}</dt><dd>${escapeHtml(folderPath)}</dd>
    </dl>

    <h2 class="section-header">${escapeHtml(confirm.SEQUENCE_HEADER)}</h2>
    <ol class="commands">${commandItems}
    </ol>

    <div class="actions">
        <button class="primary" id="start" title="${escapeHtml(confirm.START_DETAIL)}">${escapeHtml(confirm.START_LABEL)}</button>
        <button class="secondary" id="cancel" title="${escapeHtml(confirm.CANCEL_DETAIL)}">${escapeHtml(confirm.CANCEL_LABEL)}</button>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        for (const id of ["start", "cancel"]) {
            document.getElementById(id).addEventListener("click", () => {
                vscode.postMessage({ decision: id });
            });
        }
    </script>
</body>
</html>`;
}

/**
 * Registers the serializer VS Code uses when it restores a confirmation panel after a window
 * reload, and discards the restored panel.
 *
 * The panel only carries meaning while the promise returned by
 * {@link showAgenticCreateConfirmPanel} is awaiting a decision. A window reload ends that promise
 * along with its message and dispose listeners, so a restored tab can never resolve anything and
 * its buttons post to a listener that no longer exists. VS Code additionally fails to initialize a
 * webview whose view type has no registered serializer, which reaches the user as
 * "Error loading webview: Could not register service worker". Disposing the panel replaces that
 * dead tab with no tab at all.
 *
 * @returns A disposable that unregisters the serializer.
 */
export function registerAgenticCreateConfirmPanelSerializer(): vscode.Disposable {
    return vscode.window.registerWebviewPanelSerializer(
        URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE,
        {
            async deserializeWebviewPanel(panel: vscode.WebviewPanel): Promise<void> {
                panel.dispose();
            }
        }
    );
}

/**
 * Shows the confirmation gate as a non-blocking webview panel (an editor tab) that both PREVIEWS
 * the exact command plan and collects the decision.
 *
 * Chosen over a QuickPick or modal because it:
 *   - renders the exact command lines faithfully (monospace, wrapping, no truncation, and
 *     selectable/copyable) — unlike a QuickPick `detail`;
 *   - separates read-only content from actions with no misleading no-op rows;
 *   - stays open when the user clicks elsewhere (a tab isn't dismissed on focus loss), and is
 *     non-blocking (not a modal dialog);
 *   - requires an explicit button click, so there is no destructive default that a stray Enter
 *     could trigger.
 *
 * No terminal is created and nothing runs here — the caller launches the agent only when this
 * resolves `"start"`, using the same {@link PlannedCommand} array that was previewed.
 *
 * @param hostDisplayName Agent host display name (e.g. "GitHub Copilot CLI").
 * @param folderPath Absolute path of the selected target folder.
 * @param plan Ordered command plan to preview and, on approval, run.
 * @param deps Optional injected side effects.
 * @returns The user's {@link ConfirmDecision}. Closing the tab resolves `"dismissed"`.
 */
export function showAgenticCreateConfirmPanel(
    hostDisplayName: string,
    folderPath: string,
    plan: PlannedCommand[],
    deps: ShowConfirmPanelDependencies = DEFAULT_CONFIRM_PANEL_DEPENDENCIES
): Promise<ConfirmDecision> {
    return new Promise<ConfirmDecision>((resolve) => {
        const panel = deps.createWebviewPanel(
            URI_CONSTANTS.AGENTIC_CREATE_CONFIRM_VIEW_TYPE,
            URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.PANEL_TITLE,
            vscode.ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: false }
        );

        panel.webview.html = buildHtml(hostDisplayName, folderPath, plan);

        // Resolve exactly once. The message path resolves then disposes the panel (which fires
        // onDidDispose); the guard makes that disposal a no-op. A user-initiated close reaches
        // onDidDispose directly and resolves "dismissed" without re-disposing.
        let settled = false;
        const settleWith = (decision: ConfirmDecision): void => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(decision);
        };

        panel.webview.onDidReceiveMessage((message: { decision?: unknown }) => {
            if (message?.decision === "start" || message?.decision === "cancel") {
                settleWith(message.decision);
                panel.dispose();
            }
        });

        // Closing the tab without choosing an action is a possibly-accidental interruption.
        panel.onDidDispose(() => settleWith("dismissed"));
    });
}
