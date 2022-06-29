import path from "path";
import { TextDocument, Uri, workspace, WorkspaceFolder } from "vscode";
import { ITelemetry } from "../client/telemetry/ITelemetry";
import { ErrorReporter } from "../common/ErrorReporter";
import { SourceMapValidator } from "./SourceMapValidator";

/**
 * Loads the raw string content of the bundle and verifies that it contains a valid source map.
 */
export class BundleLoader {
    /**
     * Name of the bundle.
     * @example "bundle.js"
     */
    public readonly fileName: string;

    /**
     * Absolute path to the bundle on local disk.
     */
    private readonly filePath: string;

    /**
     * Creates a new BundleLoader instance.
     * @param workspaceFolder The workspace folder that contains the bundle to load.
     * @param logger The telemetry reporter to use for telemetry events.
     */
    constructor(
        relativeFilePath: string,
        private readonly workspaceFolder: WorkspaceFolder,
        private readonly logger: ITelemetry
    ) {
        this.filePath = this.getAbsoluteFilePath(relativeFilePath);
        this.fileName = path.basename(this.filePath);
    }

    /**
     * Gets the absolute path to the file to load.
     * @param filePath The relative path to the file to load.
     * @returns The absolute path to the file to load.
     */
    private getAbsoluteFilePath(filePath: string): string {
        const workspacePath = this.workspaceFolder.uri.path;

        const parsedPath = Uri.parse(filePath);
        console.log(parsedPath);
        if (parsedPath.path.startsWith(workspacePath)) {
            return filePath;
        }

        return path.join(workspacePath, filePath);
    }

    /**
     * Loads the file contents of the bundle from disk.
     * @returns The string contents of the file.
     */
    public async loadFileContents(): Promise<string> {
        try {
            const file: TextDocument = await workspace.openTextDocument(
                Uri.file(this.filePath)
            );
            const fileContent = file.getText();
            await this.warnIfNoSourceMap(fileContent);

            return fileContent;
        } catch (error) {
            await ErrorReporter.report(
                this.logger,
                "RequestInterceptor.loadFileContents.error",
                error,
                "Could not load file contents"
            );
            throw new Error(
                `Could not load control '${this.fileName}' with path '${
                    this.filePath
                }': ${error instanceof Error ? error.message : error}`
            );
        }
    }

    /**
     * Checks if the bundle has an inlined source map.
     * If not, it will show an warning message.
     * @param fileContent The file contents.
     */
    private async warnIfNoSourceMap(fileContent: string): Promise<void> {
        const isValid = SourceMapValidator.isValid(fileContent);
        if (isValid) {
            return;
        }

        await ErrorReporter.report(
            this.logger,
            "RequestInterceptor.warnIfNoSourceMap.error",
            undefined,
            `Could not find inlined source map in '${this.fileName}'. Make sure you enable source maps in webpack with 'devtool: "inline-source-map"'. For local debugging, inlined source maps are required.`
        );
    }
}
