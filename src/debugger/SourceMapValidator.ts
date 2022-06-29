/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/**
 * Class to check if a given file has a valid source map.
 */
export class SourceMapValidator {
    /**
     * Regex that matches the source map inlined in the bundle.
     */
    private static readonly sourceMapRegex =
        /sourceMappingURL=data:application\/json/;

    /**
     * Validates if a bundle contains a source map inlined using inline-source-map.
     * @param fileContents The contents of the file to validate.
     * @returns True if the source map is valid, false otherwise.
     */
    public static isValid(fileContents: string): boolean {
        const sourceMapMatch = fileContents.match(this.sourceMapRegex);
        return !!sourceMapMatch;
    }
}
