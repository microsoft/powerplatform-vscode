/* eslint-disable header/header */
/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import WebExtensionContext from '../WebExtensionContext';
import {queryParameters} from '../common/constants';

export const DataBoundaries = ['em', 'eu', 'as', 'na', 'cn'] as const;
export type GeoShortCodesType = typeof GeoShortCodes[number];
export const GeoShortCodes = [
    'ae',
    'as',
    'au',
    'br',
    'ca',
    'ch',
    'cn',
    'de',
    'eu',
    'fr',
    'in',
    'jp',
    'kr',
    'no',
    'uk',
    'us',
    'za',
  ] as const;

  export const LocationToGeoShortCode: Record<string, GeoShortCodesType> = {
    cae: 'ae',
    nae: 'ae',
    eas: 'as',
    seas: 'as',
    eau: 'au',
    seau: 'au',
    sbr: 'br',
    cca: 'ca',
    eca: 'ca',
    nch: 'ch',
    wch: 'ch',
    nde: 'de',
    wcde: 'de',
    neu: 'eu',
    weu: 'eu',
    cfr: 'fr',
    sfr: 'fr',
    cin: 'in',
    sin: 'in',
    ejp: 'jp',
    wjp: 'jp',
    suk: 'uk',
    wuk: 'uk',
    eus: 'us',
    wus: 'us',
    cus: 'us',
    ude: 'us',
    udc: 'us',
    ugtx: 'us',
    ugva: 'us',
    eus2: 'us',
    wus2: 'us',
    nza: 'za',
    wza: 'za',
    cne2: 'cn',
    cnn2: 'cn',
    skr: 'kr',
    ckr: 'kr',
    eno: 'no',
    wno: 'no',
    wrx: 'us',
    erx: 'us',
    wex: 'us',
    eex: 'us',
    unitedstates: 'us',
    europe: 'eu',
    asia: 'as',
    australia: 'au',
    japan: 'jp',
    canada: 'ca',
    india: 'in',
    unitedstatesfirstrelease: 'us',
    unitedkingdom: 'uk',
    southamerica: 'br',
    france: 'fr',
    unitedarabemirates: 'ae',
    germany: 'de',
    switzerland: 'ch',
    korea: 'kr',
    norway: 'no',
    usgov: 'us',
    usgovhigh: 'us',
    usdod: 'us',
    china: 'cn',
    usnat: 'us',
    ussec: 'us',
    southafrica: 'za',
    as: 'as',
    au: 'au',
    ca: 'ca',
    in: 'in',
    jp: 'jp',
    kr: 'kr',
    sa: 'za',
    ae: 'ae',
    us: 'us',
    uk: 'uk',
  
    eu: 'eu',
    de: 'de',
    ch: 'ch',
    no: 'no',
    fr: 'fr',
  
    // Belgium
    be: 'eu',
    bel: 'eu',
  
    // Greece
    gr: 'eu',
    grc: 'eu',
  
    // Lithuania
    lt: 'eu',
    ltu: 'eu',
  
    // Portugal
    pt: 'eu',
    prt: 'eu',
  
    // Bulgaria
    bg: 'eu',
    bgr: 'eu',
  
    // Spain
    es: 'eu',
    esp: 'eu',
  
    // Luxembourg
    lu: 'eu',
    lux: 'eu',
  
    // Romania
    ro: 'eu',
    rou: 'eu',
  
    // Czech Republic
    cz: 'eu',
    cze: 'eu',
  
    // Hungary
    hu: 'eu',
    hun: 'eu',
  
    // Slovenia
    si: 'eu',
    svn: 'eu',
  
    // Denmark
    dk: 'eu',
    dnk: 'eu',
  
    // Croatia
    hr: 'eu',
    hrv: 'eu',
  
    // Malta
    mt: 'eu',
    mlt: 'eu',
  
    // Slovakia
    sk: 'eu',
    svk: 'eu',
  
    // Italy
    it: 'eu',
    ita: 'eu',
  
    // Netherlands
    nl: 'eu',
    nld: 'eu',
  
    // Finland
    fi: 'eu',
    fin: 'eu',
  
    // Estonia
    ee: 'eu',
    est: 'eu',
  
    // Cyprus
    cy: 'eu',
    cyp: 'eu',
  
    // Austria
    at: 'eu',
    aut: 'eu',
  
    // Sweden
    se: 'eu',
    swe: 'eu',
  
    // Ireland
    ie: 'eu',
    irl: 'eu',
  
    // Latvia
    lv: 'eu',
    lva: 'eu',
  
    // Poland
    pl: 'eu',
    pol: 'eu',
  };
  
/**
 * Used to get a two character geo short code for the provided location
 * @param location Can be any string representing the country/geo - if the location is
 * not expected, we default the short code to US
 * @returns two character geo short code
 */
export function getGeoShortCodeForLocation(location: string): GeoShortCodesType {
    return (location && LocationToGeoShortCode[location.toLowerCase()]) || 'us';
}

export type DataBoundariesType = typeof DataBoundaries[number];
const _currentGeo: GeoShortCodesType = getGeoShortCodeForLocation(WebExtensionContext.urlParametersMap?.get(queryParameters.GEO)?.toLowerCase() ?? 'us');

export function getCurrentDataBoundary(): DataBoundariesType {
    return getDataBoundaryForGeoShortCode(_currentGeo);
}

/**
 * Used to get the data boundary for the provided geo short code
 * @param geo  Expected to be a two character geo short code eg. 'us', 'uk' etc.
 * @returns Telemetry data boundary for the specific location
 */
export function getDataBoundaryForGeoShortCode(geo: string): DataBoundariesType {
    return GeoToDataBoundary[geo.toLowerCase()];
}

const GeoToDataBoundary: Record<string, DataBoundariesType> = {
    // UAE
    ae: 'em',
    // Asia
    as: 'as',
    // Australia
    au: 'na',
    // South America(Brazil)
    br: 'na',
    // Canada
    ca: 'na',
    // Switzerland
    ch: 'eu',
    // China
    cn: 'cn',
    // Germany
    de: 'eu',
    // European Union
    eu: 'eu',
    // France
    fr: 'eu',
    // India
    in: 'as',
    // Japan
    jp: 'as',
    // Korea
    kr: 'as',
    // Norway
    no: 'eu',
    // United Kingdom
    uk: 'na',
    // United States
    us: 'na',
    // South Africa
    za: 'em',
  };
  