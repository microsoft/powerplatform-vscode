/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const ERRORS = {
    FILE_NOT_FOUND: "File not found",
    RETRY_LIMIT_EXCEEDED: " Retry Limit Exceeded.",
    PRECONDITION_CHECK_FAILED: "Precondition check failed.",
    SERVER_ERROR_RETRY_LATER: "We're sorry, a server error occurred. Please wait a bit and try again.",
    AUTHORIZATION_REQUIRED: "Authorization is required to perform that action. Please run again to authorize it.",
    SERVER_ERROR_PERMISSION_DENIED: "We're sorry, a server error occurred while reading from storage. Error code PERMISSION_DENIED.",
    EMPTY_RESPONSE: "Empty response",
    BAD_VALUE: "Bad value",
    LIMIT_EXCEEDED: "Limit Exceeded: .",
    THRESHOLD_LIMIT_EXCEEDED: "Threshold Rate Limit Exceeded",
    RATE_LIMIT_EXCEEDED: "Rate Limit Exceeded",
    NOT_FOUND: "Not Found",
    BAD_REQUEST: "Bad Request",
    BACKEND_ERROR: "Backend Error",
    SERVICE_UNAVAILABLE: "Service unavailable",
    SERVICE_ERROR: "Service error",
    INVALID_ARGUMENT: 'Invalid argument',
  };

   export async function expBackoff(func: { (): any; (): any; }, options: { retryNumber?: any; verbose?: any; doNotLogKnownErrors?: any; throwOnFailure?: any; }) {

    // enforce defaults
    options = options || {};

    let retry = options.retryNumber || 4;
    if (retry < 1 || retry > 4) retry = 4;

    let previousError = null;
    let retryDelay = null;
    let oldRetryDelay = null;
    let customError;
    let response = undefined;
    let error = undefined;

    // execute func() then retry <retry> times at most if errors
    for (let n = 0; n <= retry; n++) {
      // actual exponential backoff
      n && await sleep(retryDelay || (Math.pow(2, n - 1) * 1000) + (Math.round(Math.random() * 1000)));

      let noError = true;
      let isUrlFetchResponse = false;

      // Try / catch func()
      try { response = func() }
      catch (err) {
        error = err;
        noError = false;
      }


      // Handle retries on UrlFetch calls with HttpExceptions
      if (noError && response && typeof response.getResponseCode === "function") {
        isUrlFetchResponse = true;

        const responseCode = response.getResponseCode();

        // Only perform retries on error 500 for now
        if (responseCode === 500) {
          error = response;
          noError = false;
        }
      }

      // Return result that is not an error
      if (noError) {
        if (n && options.verbose) {
          const info = {
            context: "Exponential Backoff",
            successful: true,
            numberRetry: n,
          };

          retryDelay;

          logError(previousError, info, {
            asWarning: true,
            doNotLogKnownErrors: options.doNotLogKnownErrors,
          });
        }

        return response;
      }
      previousError = error;
      oldRetryDelay = retryDelay;
      retryDelay = null;

      // Process error retry
      if (!isUrlFetchResponse && error && error.message) {
        const variables: { value: string | number | Date; }[] = [];
        const normalizedError = getNormalizedError(error.message, variables);

        // If specific error that explicitly give the retry time
        if (normalizedError === ERRORS.THRESHOLD_LIMIT_EXCEEDED && variables[0] && variables[0].value) {
          retryDelay = (new Date(variables[0].value).getTime() - new Date().getTime()) + 1000;

          oldRetryDelay && logError(error, {
            failReason: 'Failed after waiting ' + oldRetryDelay + 'ms',
            context: "Exponential Backoff",
            numberRetry: n,
            retryDelay: retryDelay,
          }, {
            asWarning: true,
            doNotLogKnownErrors: options.doNotLogKnownErrors,
          });

          // Do not wait too long
          if (retryDelay < 32000) continue;

          customError = logError(error, {
            failReason: 'Retry delay > 31s',
            context: "Exponential Backoff",
            numberRetry: n,
            retryDelay: retryDelay,
          }, { doNotLogKnownErrors: options.doNotLogKnownErrors });

          if (options.throwOnFailure) throw customError;
          return customError;
        }

        customError = logError(error, {
          failReason: 'No retry needed',
          numberRetry: n,
          context: "Exponential Backoff"
        }, { doNotLogKnownErrors: options.doNotLogKnownErrors });

        if (options.throwOnFailure) throw customError;
        return customError;
      }

    }
      return response;
    }

  export function logError(error: string | Error , additionalParams: { [x: string]: any; failReason?: string; context?: string; numberRetry?: number; retryDelay?: number; urlFetchWithMuteHttpExceptions?: boolean; addonName?: any; versionNumber?: any; }, options1: { asWarning?: any; doNotLogKnownErrors?: any; }) {
    const options =  {};
    console.log(options1);
    console.log(options);

    error = (typeof error === 'string') ? new Error(error) : error;
    const partialMatches: any[] = [];
    const normalizedMessage = getNormalizedError(error.message, partialMatches);
    const message = normalizedMessage ;

    const log = {
      context: {
        originalMessage: error.message,
      }
    };

    // Return an error, with context
    const customError = new Error(message || log.context.originalMessage || error.message);
    Object.assign(customError, { context: log.context });

    return customError;
  }

  async function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getNormalizedError(message: string, partialMatches: any[]) {
    return message + partialMatches ;
  }

  function throwNull2NonNull(field: string, d: any): never {
    return errorHelper(field, d, "non-nullable object", false);
  }
  function throwNotObject(field: string, d: any, nullable: boolean): never {
    return errorHelper(field, d, "object", nullable);
  }
  function throwIsArray(field: string, d: any, nullable: boolean): never {
    return errorHelper(field, d, "object", nullable);
  }
  function checkArray(d: any, field: string): void {
    if (!Array.isArray(d) && d !== null && d !== undefined) {
      errorHelper(field, d, "array", true);
    }
  }
  function checkString(d: any, nullable: boolean, field: string): void {
    if (typeof(d) !== 'string' && (!nullable || (nullable && d !== null && d !== undefined))) {
      errorHelper(field, d, "string", nullable);
    }
  }

  function errorHelper(field: string, d: any, type: string, nullable: boolean): never {
    if (nullable) {
      type += ", null, or undefined";
    }
    throw new TypeError('Expected ' + type + " at " + field + " but found:\n" + JSON.stringify(d) + "\n\nFull object:\n");
  }
