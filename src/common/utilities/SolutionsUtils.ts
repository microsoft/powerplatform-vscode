/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ServiceEndpointCategory } from "../services/Constants";

// Interfaces for type safety
export interface ISolution {
    solutionid: string;
    friendlyname: string;
    uniquename: string;
    version: string;
    description?: string;
    publisherid?: string;
    ismanaged?: boolean;
}

export interface ISolutionComponent {
    msdyn_solutioncomponentsummaryid: string;
    msdyn_displayname: string;
    msdyn_objectid: string;
    msdyn_solutionid: string;
    msdyn_componenttype: string;
}

export interface ISolutionWithComponents extends ISolution {
    componentCount: number;
    components: ISolutionComponent[];
}

export async function fetchSolutions(orgUrl: string): Promise<ISolution[]> {
    try {
        const response = await fetch(`${orgUrl}/api/data/v9.1/solutions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching solutions: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Failed to fetch solutions:", error);
        throw error;
    }
}

/**
 * Fetch solutions with optional filtering to reduce the number of solutions to process
 * @param orgUrl The organization URL
 * @param filterOptions Optional filtering options
 * @returns Array of filtered solutions
 */
export async function fetchFilteredSolutions(
    orgUrl: string,
    filterOptions?: {
        excludeManaged?: boolean;
        excludeSystem?: boolean;
        includeOnlyVisible?: boolean;
    }
): Promise<ISolution[]> {
    try {
        let filterQuery = '';
        const filters: string[] = [];

        if (filterOptions?.excludeManaged) {
            filters.push('ismanaged eq false');
        }

        if (filterOptions?.excludeSystem) {
            // Exclude common system solutions that typically don't contain site components
            filters.push("friendlyname ne 'Default Solution'");
            filters.push("friendlyname ne 'Basic Solution'");
            filters.push("uniquename ne 'Default'");
        }

        if (filterOptions?.includeOnlyVisible) {
            filters.push('isvisible eq true');
        }

        if (filters.length > 0) {
            filterQuery = `?$filter=${filters.join(' and ')}`;
        }

        const response = await fetch(`${orgUrl}/api/data/v9.1/solutions${filterQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching filtered solutions: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Failed to fetch filtered solutions:", error);
        throw error;
    }
}

export async function fetchSolutionComponents(orgUrl: string, solutionId: string, siteId: string): Promise<ISolutionComponent[]> {
    try {
        const response = await fetch(`${orgUrl}/api/data/v9.2/msdyn_solutioncomponentsummaries?$filter=(msdyn_solutionid eq ${solutionId} and msdyn_objectid eq ${siteId})&$orderby=msdyn_displayname asc&api-version=9.1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching solution components: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Failed to fetch solution components:", error);
        throw error;
    }
}

/**
 * Gets all solutions that contain components for the specified site (optimized for large numbers of solutions)
 * @param orgUrl The organization URL
 * @param siteId The site ID to check for components
 * @param maxConcurrentRequests Maximum number of concurrent API requests (default: 10)
 * @param filterOptions Optional filtering to reduce the number of solutions to check
 * @returns Array of solutions that contain components for the specified site
 */
export async function getSolutionsWithSiteComponents(
    orgUrl: string,
    siteId: string,
    maxConcurrentRequests = 10,
    filterOptions?: {
        excludeManaged?: boolean;
        excludeSystem?: boolean;
        includeOnlyVisible?: boolean;
    }
): Promise<ISolutionWithComponents[]> {
    try {
        // Get solutions with optional filtering to reduce processing load
        const allSolutions = filterOptions
            ? await fetchFilteredSolutions(orgUrl, filterOptions)
            : await fetchSolutions(orgUrl);

        if (allSolutions.length === 0) {
            return [];
        }

        const solutionsWithComponents: ISolutionWithComponents[] = [];

        // Process solutions in batches to avoid overwhelming the server
        for (let i = 0; i < allSolutions.length; i += maxConcurrentRequests) {
            const batch = allSolutions.slice(i, i + maxConcurrentRequests);

            // Create promises for concurrent processing
            const batchPromises = batch.map(async (solution) => {
                try {
                    const components = await fetchSolutionComponents(orgUrl, solution.solutionid, siteId);

                    // Return solution with components if any exist, otherwise null
                    if (components && components.length > 0) {
                        return {
                            ...solution,
                            componentCount: components.length,
                            components: components
                        } as ISolutionWithComponents;
                    }
                    return null;
                } catch (error) {
                    // Log error for individual solution but don't fail the batch
                    console.warn(`Failed to fetch components for solution ${solution.solutionid}:`, error);
                    return null;
                }
            });

            // Wait for all promises in the current batch to complete
            const batchResults = await Promise.allSettled(batchPromises);

            // Extract successful results and add to final array
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value !== null) {
                    solutionsWithComponents.push(result.value);
                }
            });
        }

        return solutionsWithComponents;
    } catch (error) {
        console.error("Failed to get solutions with site components:", error);
        throw error;
    }
}

/**
 * Lightweight function to get only solution IDs that contain components for the specified site
 * This is more efficient when you only need to know which solutions have components without fetching full solution details
 * @param orgUrl The organization URL
 * @param siteId The site ID to check for components
 * @param maxConcurrentRequests Maximum number of concurrent API requests (default: 15)
 * @returns Array of solution IDs that contain components for the specified site
 */
export async function getSolutionIdsWithSiteComponents(
    orgUrl: string,
    siteId: string,
    maxConcurrentRequests = 15
): Promise<string[]> {
    try {
        // Get all solutions but only extract IDs for faster processing
        const allSolutions = await fetchSolutions(orgUrl);

        if (allSolutions.length === 0) {
            return [];
        }

        const solutionIdsWithComponents: string[] = [];

        // Process solution IDs in batches
        for (let i = 0; i < allSolutions.length; i += maxConcurrentRequests) {
            const batch = allSolutions.slice(i, i + maxConcurrentRequests);

            // Create promises for concurrent processing
            const batchPromises = batch.map(async (solution) => {
                try {
                    const components = await fetchSolutionComponents(orgUrl, solution.solutionid, siteId);
                    return components && components.length > 0 ? solution.solutionid : null;
                } catch (error) {
                    console.warn(`Failed to fetch components for solution ${solution.solutionid}:`, error);
                    return null;
                }
            });

            // Wait for all promises in the current batch to complete
            const batchResults = await Promise.allSettled(batchPromises);

            // Extract successful results
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value !== null) {
                    solutionIdsWithComponents.push(result.value);
                }
            });
        }

        return solutionIdsWithComponents;
    } catch (error) {
        console.error("Failed to get solution IDs with site components:", error);
        throw error;
    }
}




/**
 * Gets the Power Apps Studio base URL based on the service endpoint
 * @param serviceEndpointStamp The service endpoint category
 * @returns The base URL for Power Apps Studio
 */
function getPowerAppsStudioBaseUrl(serviceEndpointStamp: ServiceEndpointCategory): string {
    switch (serviceEndpointStamp) {
        case ServiceEndpointCategory.TEST:
            return "https://make.test.powerapps.com";
        case ServiceEndpointCategory.PREPROD:
            return "https://make.preprod.powerapps.com";
        case ServiceEndpointCategory.PROD:
            return "https://make.powerapps.com";
        case ServiceEndpointCategory.DOD:
            return "https://make.powerapps.appsplatform.us";
        case ServiceEndpointCategory.GCC:
            return "https://make.gov.powerapps.us";
        case ServiceEndpointCategory.HIGH:
            return "https://make.high.powerapps.us";
        case ServiceEndpointCategory.MOONCAKE:
            return "https://make.powerapps.cn";
        default:
            return "";
    }
}

/**
 * Constructs the Solution Explorer URL for a given environment
 * @param environmentId The environment ID
 * @param serviceEndpointStamp The service endpoint category (TEST, PREPROD, PROD, etc.)
 * @returns The complete Solution Explorer URL or empty string if construction fails
 */
export function getSolutionExplorerUrl(environmentId: string, serviceEndpointStamp?: ServiceEndpointCategory): string {
    if (!environmentId || !serviceEndpointStamp) {
        return "";
    }

    const baseEndpoint = getPowerAppsStudioBaseUrl(serviceEndpointStamp);
    if (!baseEndpoint) {
        return "";
    }

    return `${baseEndpoint}/environments/${environmentId}/solutions`;
}
