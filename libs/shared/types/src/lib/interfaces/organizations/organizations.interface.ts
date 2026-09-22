/**
 * An organization (tenant) as offered in a picker. Only a platform admin ever sees
 * the list: it belongs to no organization, so it must say which one a new
 * department or AI config is for (module spec criterion 7).
 */
export interface IOrganizationOption {
  organizationId: string;
  name: string;
  slug: string;
}
