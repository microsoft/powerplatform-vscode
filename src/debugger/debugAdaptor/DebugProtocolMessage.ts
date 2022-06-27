/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { DebugProtocolMessage } from "vscode";

/**
 * Extends the {@link DebugProtocolMessage} class the [ProtocolMessage](https://microsoft.github.io/debug-adapter-protocol/specification#Base_Protocol_ProtocolMessage) type defined in the Debug Adapter Protocol.
 */
export interface ProtocolMessage extends DebugProtocolMessage {
    /**
     * Sequence number (also known as message ID). For protocol messages of type
     * 'request' this ID can be used to cancel the request.
     */
    seq: number;

    /**
     * Message type.
     * Values: 'request', 'response', 'event', etc.
     */
    type: "request" | "response" | "event" | string;

    /**
     * Message command.
     */
    command: string;
}
