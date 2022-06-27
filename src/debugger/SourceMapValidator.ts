/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/**
 * Class to check if a given file has a valid source map.
 */
export class SourceMapValidator {
    /**
     * Validates if a bundle contains a source map inlined using inline-source-map.
     * @param fileContents The contents of the file to validate.
     * @returns True if the source map is valid, false otherwise.
     */
    public static isValid(fileContents: string): boolean {
        const sourceMapRegex = /sourceMappingURL=data:application\/json/;
        const sourceMapMatch = fileContents.match(sourceMapRegex);

        return !!sourceMapMatch;
    }
}
