import { Prisma } from '@ats-platform/database';

/**
 * Resolve the organization a write belongs to, for the three call sites that have no
 * organization in hand: creating a Department, creating an AiConfig, and seeding the
 * default AiConfig at boot. Every other org-scoped write derives its organization from
 * a parent row (an application from its job posting, a recruiter from its department,
 * and so on) and must keep doing that instead of calling this.
 *
 * TODO(GĐ1 Tuần 2): replace each call with the CALLER'S OWN organization once
 * org-context propagation and the `org-admin` tier exist. Module spec criterion 7
 * (docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md) states the target
 * behaviour: an org-admin's organization comes from its own binding and may not be
 * overridden; a platform-admin, belonging to no organization, must supply one
 * explicitly in the request.
 *
 * Why a lookup rather than the seed organization's literal UUID: exactly one
 * organization exists today, so any resolution gives the same answer — but a hard-coded
 * id would keep giving an answer after that stops being true, silently writing rows
 * into the wrong tenant. This throws instead. The second organization ever created
 * makes every remaining call site fail loudly, which is what turns the TODO above from
 * a note somebody has to remember into something the system reports.
 */
export async function resolveSoleOrganizationId(
  client: Prisma.TransactionClient,
): Promise<string> {
  const organizations = await client.organization.findMany({
    select: { organizationId: true },
    take: 2,
  });

  if (organizations.length === 0) {
    throw new Error(
      'No organization exists. The tenant migration seeds one — run migrations before writing org-scoped rows.',
    );
  }

  if (organizations.length > 1) {
    throw new Error(
      "More than one organization exists, so the caller's organization can no longer be inferred. " +
        'Resolve organizationId from the authenticated caller instead (module spec criterion 7).',
    );
  }

  return organizations[0].organizationId;
}
