/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export function getDeviceType(): string {
    if (isMobileDevice()) {
      return 'Mobile';
    } else if (isTabletDevice()) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }
  /**
   * Get a flag indicating whether or not the user's device is a mobile (but NOT tablet) device
   *
   * Regex taken from is-mobile package
   */
  export function isMobileDevice(): boolean {
    const mobileRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
  
    return mobileRE.test(navigator.userAgent);
  }
  /**
   * Get a flag indicating whether or not the user's device is a tablet device
   *
   * Regexes taken from is-mobile package
   */
  export function isTabletDevice(): boolean {
    const tabletRE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk/i;
  
    return tabletRE.test(navigator.userAgent);
  }
  