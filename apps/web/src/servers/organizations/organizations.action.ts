"use server";

import http from "@/lib/http";
import { IOrganizationOption, UserRole } from "@ats-platform/types";
import { getMeAction } from "@/servers/users/users.action";

/**
 * The organizations to offer in a create form — and ONLY to a platform admin.
 *
 * A platform admin belongs to no organization, so the API requires it to name one
 * when creating a department or an AI config (module spec criterion 7). Everyone
 * else gets an empty list: their own organization is applied by the API, and
 * `GET /organizations` is closed to them anyway.
 */
export async function getOrganizationOptionsForCurrentUser(): Promise<IOrganizationOption[]> {
    const me = await getMeAction();
    if (me?.role !== UserRole.admin) return [];

    try {
        const response = await http.get(`/organizations`);
        return (response.data as IOrganizationOption[]).map(({ organizationId, name, slug }) => ({
            organizationId,
            name,
            slug,
        }));
    } catch {
        return [];
    }
}

/** DB-resolved scope for staff; platform admins have no organization. */
export async function getCurrentOrganizationAction(): Promise<IOrganizationOption | null> {
    try {
        const response = await http.get('/organizations/me');
        return response.data as IOrganizationOption;
    } catch {
        return null;
    }
}
