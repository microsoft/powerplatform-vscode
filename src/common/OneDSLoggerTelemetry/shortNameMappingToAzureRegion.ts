/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const azureRegions = {
    // Americas
    USWest: 'westus',
    USWest2: 'westus2',
    USCentral: 'centralus',
    USEast: 'eastus',
    USEast2: 'eastus2',
    USNorthCentral: 'northcentralus',
    USSouthCentral: 'southcentralus',
    USWestCentral: 'westcentralus',
    CanadaCentral: 'canadacentral',
    CanadaEast: 'canadaeast',
    BrazilSouth: 'brazilsouth',

    // Europe
    EuropeNorth: 'northeurope',
    EuropeWest: 'westeurope',
    UKSouth: 'uksouth',
    UKWest: 'ukwest',
    FranceCentral: 'francecentral',
    FranceSouth: 'francesouth',
    SwitzerlandNorth: 'switzerlandnorth',
    SwitzerlandWest: 'switzerlandwest',
    GermanyNorth: 'germanynorth',
    GermanyWestCentral: 'germanywestcentral',
    NorwayWest: 'norwaywest',
    NorwayEast: 'norwayeast',

    // Asia
    AsiaEast: 'eastasia',
    AsiaSouthEast: 'southeastasia',
    JapanEast: 'japaneast',
    JapanWest: 'japanwest',
    AustraliaEast: 'australiaeast',
    AustraliaSouthEast: 'australiasoutheast',
    AustraliaCentral: 'australiacentral',
    AustraliaCentral2: 'australiacentral2',
    IndiaCentral: 'centralindia',
    IndiaSouth: 'southindia',
    IndiaWest: 'westindia',
    KoreaSouth: 'koreasouth',
    KoreaCentral: 'koreacentral',

    // UAE
    UAECentral: 'uaecentral',
    UAENorth: 'uaenorth',
    SouthAfricaNorth: 'southafricanorth',
    SouthAfricaWest: 'southafricawest',

    // Germany
    GermanyCentral: 'germanycentral',
    GermanyNorthEast: 'germanynortheast',

    // Singapore
    SingaporeSouthEast: 'southeastasia',

    /// <summary>
    /// U.S. government cloud in Virginia.
    /// </summary>

    GovernmentUSVirginia: 'usgovvirginia',

    /// <summary>
    /// U.S. government cloud in Iowa.
    /// </summary>
    GovernmentUSIowa: 'usgoviowa',

    /// <summary>
    /// U.S. government cloud in Arizona.
    /// </summary>
    GovernmentUSArizona: 'usgovarizona',

    /// <summary>
    /// U.S. government cloud in Texas.
    /// </summary>
    GovernmentUSTexas: 'usgovtexas',

    GovernmentUSDodEast: 'usdodeast',
    GovernmentUSDodCentral: 'usdodcentral',

    /// <summary>
    /// China Environment
    /// <summary>
    ChinaNorth: 'chinanorth',
    ChinaNorth2: 'chinanorth2',
    ChinaNorth3: 'chinanorth3',
    ChinaEast: 'chinaeast',
    ChinaEast2: 'chinaeast2',
    ChinaEast3: 'chinaeast3',
};

export const regionShortName = {
    wus: 'wus',
    cus: 'cus',
    eus: 'eus',
    eus2: 'eus2',
    wcus: 'wcus',
    wus2: 'wus2',
    scus: 'scus',
    sbr: 'sbr',
    suk: 'suk',
    wuk: 'wuk',
    ejp: 'ejp',
    wjp: 'wjp',
    cin: 'cin',
    sin: 'sin',
    wcde: 'wcde',
    nde: 'nde',
    neu: 'neu',
    weu: 'weu',
    eau: 'eau',
    seau: 'seau',
    seas: 'seas',
    eas: 'eas',
    cca: 'cca',
    eca: 'eca',
    nza: 'nza',
    wza: 'wza',
    cfr: 'cfr',
    sfr: 'sfr',
    nae: 'nae',
    cae: 'cae',
    nch: 'nch',
    wch: 'wch',
    eno: 'eno',
    wno: 'wno',
    ckr: 'ckr',
    skr: 'skr',
    ugtx: 'ugtx',
    ugva: 'ugva',
    udc: 'udc',
    ude: 'ude',
    cne: 'cne',
    cne2: 'cne2',
    cne3: 'cne3',
    cnn: 'cnn',
    cnn2: 'cnn2',
    cnn3: 'cnn3'
};

export const geoMappingsToAzureRegion = {
    // Public
    [regionShortName.wus]: { geoName: 'us', azureRegion: azureRegions.USWest },
    [regionShortName.cus]: { geoName: 'us', azureRegion: azureRegions.USCentral },
    [regionShortName.eus]: { geoName: 'us', azureRegion: azureRegions.USEast },
    [regionShortName.eus2]: { geoName: 'us', azureRegion: azureRegions.USEast2 },
    [regionShortName.wcus]: { geoName: 'us', azureRegion: azureRegions.USWestCentral },
    [regionShortName.wus2]: { geoName: 'us', azureRegion: azureRegions.USWest2 },
    [regionShortName.scus]: { geoName: 'us', azureRegion: azureRegions.USSouthCentral },
    [regionShortName.sbr]: { geoName: 'br', azureRegion: azureRegions.BrazilSouth },
    [regionShortName.suk]: { geoName: 'uk', azureRegion: azureRegions.UKSouth },
    [regionShortName.wuk]: { geoName: 'uk', azureRegion: azureRegions.UKWest },
    [regionShortName.ejp]: { geoName: 'jp', azureRegion: azureRegions.JapanEast },
    [regionShortName.wjp]: { geoName: 'jp', azureRegion: azureRegions.JapanWest },
    [regionShortName.cin]: { geoName: 'in', azureRegion: azureRegions.IndiaCentral },
    [regionShortName.sin]: { geoName: 'in', azureRegion: azureRegions.IndiaSouth },
    [regionShortName.wcde]: { geoName: 'de', azureRegion: azureRegions.GermanyWestCentral },
    [regionShortName.nde]: { geoName: 'de', azureRegion: azureRegions.GermanyNorth },
    [regionShortName.neu]: { geoName: 'eu', azureRegion: azureRegions.EuropeNorth },
    [regionShortName.weu]: { geoName: 'eu', azureRegion: azureRegions.EuropeWest },
    [regionShortName.eau]: { geoName: 'au', azureRegion: azureRegions.AustraliaEast },
    [regionShortName.seau]: { geoName: 'au', azureRegion: azureRegions.AustraliaSouthEast },
    [regionShortName.seas]: { geoName: 'as', azureRegion: azureRegions.AsiaSouthEast },
    [regionShortName.eas]: { geoName: 'as', azureRegion: azureRegions.AsiaEast },
    [regionShortName.cca]: { geoName: 'ca', azureRegion: azureRegions.CanadaCentral },
    [regionShortName.eca]: { geoName: 'ca', azureRegion: azureRegions.CanadaEast },
    [regionShortName.nza]: { geoName: 'za', azureRegion: azureRegions.SouthAfricaNorth },
    [regionShortName.wza]: { geoName: 'za', azureRegion: azureRegions.SouthAfricaWest },
    [regionShortName.cfr]: { geoName: 'fr', azureRegion: azureRegions.FranceCentral },
    [regionShortName.sfr]: { geoName: 'fr', azureRegion: azureRegions.FranceSouth },
    [regionShortName.nae]: { geoName: 'ae', azureRegion: azureRegions.UAENorth },
    [regionShortName.cae]: { geoName: 'ae', azureRegion: azureRegions.UAECentral },
    [regionShortName.nch]: { geoName: 'ch', azureRegion: azureRegions.SwitzerlandNorth },
    [regionShortName.wch]: { geoName: 'ch', azureRegion: azureRegions.SwitzerlandWest },
    [regionShortName.eno]: { geoName: 'no', azureRegion: azureRegions.NorwayEast },
    [regionShortName.wno]: { geoName: 'no', azureRegion: azureRegions.NorwayWest },
    [regionShortName.ckr]: { geoName: 'kr', azureRegion: azureRegions.KoreaCentral },
    [regionShortName.skr]: { geoName: 'kr', azureRegion: azureRegions.KoreaSouth },
    // Government US.
    [regionShortName.ugtx]: { geoName: 'usgov', azureRegion: azureRegions.GovernmentUSTexas },
    [regionShortName.ugva]: { geoName: 'usgov', azureRegion: azureRegions.GovernmentUSVirginia },
    [regionShortName.udc]: { geoName: 'usgov', azureRegion: azureRegions.GovernmentUSDodCentral },
    [regionShortName.ude]: { geoName: 'usgov', azureRegion: azureRegions.GovernmentUSDodEast },
    // Goverment China Mooncake
    [regionShortName.cne]: { geoName: 'cn', azureRegion: azureRegions.ChinaEast },
    [regionShortName.cne2]: { geoName: 'cn', azureRegion: azureRegions.ChinaEast2 },
    [regionShortName.cne3]: { geoName: 'cn', azureRegion: azureRegions.ChinaEast3 },
    [regionShortName.cnn]: { geoName: 'cn', azureRegion: azureRegions.ChinaNorth },
    [regionShortName.cnn2]: { geoName: 'cn', azureRegion: azureRegions.ChinaNorth2 },
    [regionShortName.cnn3]: { geoName: 'cn', azureRegion: azureRegions.ChinaNorth3 },
};
