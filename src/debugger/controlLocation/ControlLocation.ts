/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/**
 * Control location informs the {@link ControlLocator} where a control is located.
 */
export type ControlLocation = {
    /**
     * The logical name of your PCF control. The logical name is defined as `<publisherPrefix>_<namespace>.<controlName>`. Namespace and controlName are defined in the ControlManifest.xml. Dataverse will display the logical name of your control when looking at the control in the solution. Example: Control Name 'MyCustomControl'. Publisher Name: 'm365'. Namespace: 'Workflows'. -> Logical Name: 'm365_Workflows.MyCustomControl'.
     */
    controlName: string;
} & (ControlTabLocation | ControlFullscreenLocation);

/**
 * Type used for controls that are located on a tab within a page.
 */
type ControlTabLocation = {
    /**
     * The name of the tab that hosts the control. If this is specified, the browser will try to navigate to the tab to load the control.
     */
    tabName: string;

    /**
     * Wether to render the control as a full page control.
     * **Not supported if the control is located on a tab.**.
     */
    renderFullScreen: false;

    /**
     * The model driven application id which is used to host the PCF control.
     */
    appId?: never;
};

/**
 * Type used for controls that can be rendered full screen.
 */
type ControlFullscreenLocation = {
    /**
     * Name of the tab that the control is located on.
     * **Not supported if the control is rendered as a full page control.**.
     */
    tabName?: never;

    /**
     * Wether to render the control as a full page control.
     */
    renderFullScreen: true;

    /**
     * The model driven application id which is used to host the PCF control.
     */
    appId: string;
};
