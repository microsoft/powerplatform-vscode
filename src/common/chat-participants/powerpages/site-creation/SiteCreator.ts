/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IPowerPagesSiteFromJsonActions } from "./PowerPagesSiteManager";
import { PowerPagesParsedJson } from "./PowerPagesSiteModel";

type UseCreateSiteParams = {
    ppSiteData: PowerPagesParsedJson;
    powerPagesSiteActions: IPowerPagesSiteFromJsonActions;
    language: string;
};

export const useCreateSite = ({
    ppSiteData,
    powerPagesSiteActions,
    language,
}: UseCreateSiteParams) => {
    let scenario: Scenario;
    const currentEnvironment = getCurrentEnvironment();
    const createPortalV2 = createPortalV2Factory({ telemetryOptions: { telemetryScope } });

    const createSite = async (siteName: string, pages: Record<string, PagePayload>) => {
        scenario.progress({ eventName: 'useCreateSite/createSite/start' });

        powerPagesSiteActions.updateSiteName(siteName);

        const promises = Object.entries(pages).map(([key, value]) => {
            return powerPagesSiteActions.addOrUpdatePage(
                value.name,
                value.layout?.contentHtml ?? '',
                key === HOME_PAGE_KEY
            );
        });

        await Promise.all(promises);


        try {
            await powerPagesSiteActions.save();

            const websiteId = ppSiteData.powerpagesite?.[0]?.powerpagesiteid ?? '';
            scenario.progress({ eventName: 'useCreateSite/createSite/complete', websiteId });

            return websiteId;
        } catch (err) {
            scenario.progress({ eventName: 'useCreateSite/createSite/error', err });
            throw err;
        }
    };

    const createPortal = async (siteName: string, siteUrl: string, websiteId: string) => {

        const {
            resourceId: orgId,
            instanceUrl: orgUrl,
            friendlyName: orgName,
        } = getLinkedEnvironmentMetadata(currentEnvironment)!;

        const payload = {
            orgId,
            orgUrl,
            orgName,
            portalName: siteName,
            packageName: getPackageUniqueNameV2(TemplateUniqueNames.BlankTemplate),
            portalLanguage: getLanguageLcidByLabel(language).toString(),
            subDomain: siteUrl,
            websiteId,
            isPowerPages: true,
        };

        try {
            const portal = await createPortalV2.mutateAsync(payload);

            logger.logFeatureUsage(TelemetryEvents.CREATE_PORTAL_SUCCESS, { websiteId, portalId: portal.Id });

            return portal;
        } catch (err) {
            const { code, message } = getCDSErrorCodeAndMessage(err as AxiosError<CDSError>);
            const errorWithCause = getErrorWithCause(err as AxiosError<CDSError>, { code, stack: message });
            logger.logError(TelemetryEvents.CREATE_PORTAL_FAILED, message, {
                error: errorWithCause,
                payload,
            });
            throw err;
        }
    };

    const createPowerPage = async (payload: SitePayload) => {
        logger.logFeatureUsage(TelemetryEvents.CREATE_SITE);

        scenario = trackLoadScenario(
            telemetryScope,
            TelemetryScenarioNames.useCreateSite,
            undefined,
            Team.PowerPortals
        );

        const { siteName, siteUrl } = payload;

        const websiteId = await createSite(siteName, payload.pages);
        return await createPortal(siteName, siteUrl, websiteId);
    };

    const submitForm = async (values: Site) => {
        const sitePayload = transformSiteFormToPayload(values);
        await createPowerPage(sitePayload);
    };

    return {
        createSite,
        createPortal,
        createPowerPage,
        submitForm,
    };
};
