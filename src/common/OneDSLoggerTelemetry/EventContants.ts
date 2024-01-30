/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export enum SeverityLevel {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Critical = 'Critical',
}

export enum CustomEventModifier {
    Complete = 'Complete',
    Failure = 'Failure',
    Progress = 'Progress',
    Start = 'Start',
}
  
export enum EventType {
    Info = 'Information',
    Warning = 'Warning',
    Error = 'Error',
}

export enum CustomEventSubType {
    Load = 'Load',
    Create = 'Create',
    Update = 'Update',
    Delete = 'Delete',
}

export enum CustomType {
  /**
   * Defines a user action to track.
   */
  Action = 'Action',

  /**
   * Defines a custom event to track.
   */
  Custom = 'Custom',

  /**
   * Defines a scenario to track, that has a start, an end and duration.
   */
  Scenario = 'Scenario',

}

export enum OneDSCollectorEventName {
    VSCODE_EVENT = 'VscodeEvent',
    REDACTED = "-REDACTED-"
}