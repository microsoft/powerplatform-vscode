/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IArtemisServiceResponse } from "../common/services/Interfaces";

interface IArtemisContext {
    ServiceResponse: IArtemisServiceResponse
}

class ArtemisContext implements IArtemisContext {
    private _artemisResponse: IArtemisServiceResponse;

    constructor() {
        this._artemisResponse = {} as IArtemisServiceResponse;
    }

    get ServiceResponse(): IArtemisServiceResponse {
        return this._artemisResponse;
    }

    setContext(value: IArtemisServiceResponse) {
        this._artemisResponse = value;
    }
}

export default new ArtemisContext();
