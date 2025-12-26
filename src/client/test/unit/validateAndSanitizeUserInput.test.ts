/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { validateAndSanitizeUserInput } from "../../../common/utilities/InputValidator";

describe("validateAndSanitizeUserInput", () => {
    describe("null and undefined handling", () => {
        it("should return null for undefined input", () => {
            const result = validateAndSanitizeUserInput(undefined);
            expect(result).to.be.null;
        });

        it("should return null for null input", () => {
            const result = validateAndSanitizeUserInput(null);
            expect(result).to.be.null;
        });
    });

    describe("empty and whitespace handling", () => {
        it("should return null for empty string", () => {
            const result = validateAndSanitizeUserInput("");
            expect(result).to.be.null;
        });

        it("should return null for whitespace-only string", () => {
            const result = validateAndSanitizeUserInput("   ");
            expect(result).to.be.null;
        });

        it("should return null for string with only tabs and newlines", () => {
            const result = validateAndSanitizeUserInput("\t\n\t\n");
            expect(result).to.be.null;
        });

        it("should trim leading and trailing whitespace", () => {
            const result = validateAndSanitizeUserInput("  hello world  ");
            expect(result).to.equal("hello world");
        });
    });

    describe("length truncation", () => {
        it("should not truncate text under max length", () => {
            const input = "a".repeat(100);
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal(input);
            expect(result?.length).to.equal(100);
        });

        it("should truncate text exceeding default max length (2000)", () => {
            const input = "a".repeat(2500);
            const result = validateAndSanitizeUserInput(input);
            expect(result?.length).to.equal(2000);
        });

        it("should truncate text exceeding custom max length", () => {
            const input = "a".repeat(200);
            const result = validateAndSanitizeUserInput(input, 100);
            expect(result?.length).to.equal(100);
        });

        it("should respect custom max length for shorter text", () => {
            const input = "hello";
            const result = validateAndSanitizeUserInput(input, 100);
            expect(result).to.equal("hello");
        });
    });

    describe("control character removal", () => {
        it("should remove null byte", () => {
            const input = "hello\x00world";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("helloworld");
        });

        it("should remove various control characters", () => {
            const input = "hello\x01\x02\x03\x04\x05\x06\x07\x08world";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("helloworld");
        });

        it("should remove form feed and vertical tab", () => {
            const input = "hello\x0B\x0Cworld";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("helloworld");
        });

        it("should remove DEL character", () => {
            const input = "hello\x7Fworld";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("helloworld");
        });

        it("should preserve tab character", () => {
            const input = "hello\tworld";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("hello\tworld");
        });

        it("should preserve newline character", () => {
            const input = "hello\nworld";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("hello\nworld");
        });
    });

    describe("line ending normalization", () => {
        it("should normalize CRLF to LF", () => {
            const input = "hello\r\nworld";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("hello\nworld");
        });

        it("should normalize CR to LF", () => {
            const input = "hello\rworld";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("hello\nworld");
        });

        it("should handle mixed line endings", () => {
            const input = "line1\r\nline2\rline3\nline4";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("line1\nline2\nline3\nline4");
        });
    });

    describe("combined scenarios", () => {
        it("should handle text with multiple issues", () => {
            const input = "  hello\x00\r\nworld\x7F  ";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("hello\nworld");
        });

        it("should handle valid multi-line code snippet", () => {
            const input = "function test() {\n\treturn true;\n}";
            const result = validateAndSanitizeUserInput(input);
            expect(result).to.equal("function test() {\n\treturn true;\n}");
        });

        it("should handle user feedback with special characters", () => {
            const input = "Great feature! <script>alert('xss')</script>";
            const result = validateAndSanitizeUserInput(input);
            // HTML tags are preserved - HTML escaping is done separately if needed
            expect(result).to.equal("Great feature! <script>alert('xss')</script>");
        });
    });
});
