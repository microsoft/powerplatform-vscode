/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { FlattenType } from "./FlattenType";
import { IPcfLaunchConfig } from "./IPcfLaunchConfig";

/**
 * Represents the {@link FlattenType flattened} type of the {@link IPcfLaunchConfig}.
 */
export type LaunchDebugConfiguration = FlattenType<IPcfLaunchConfig>;
