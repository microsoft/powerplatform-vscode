/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
export class TelemetryData {
    private _eventName: string;
    private _properties: Record<string, string>;
    private _measurements: Record<string, number>;

    public get eventName(): string {
        return this._eventName;
    }

    public get properties(): Record<string, string> {
        return this._properties;
    }

    public get measurements(): Record<string, number> {
        return this._measurements;
    }

    constructor(eventName: string) {
        this._eventName = eventName;
        this._properties = {};
        this._measurements = {};
    }

    addProperty(key:string, value: string): void {
        this._properties[key] = value;
    }

    addMeasurement(key: string, value: number): void {
        this._measurements[key] = value;
    }

}
