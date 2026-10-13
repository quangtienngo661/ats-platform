/** Navigation hints; the API remains the authority and resolves scope from DB. */
const recruiting = ['/dashboard', '/jobs', '/interviews', '/my-profile'];
const organizationAdmin = ['/department-management', '/recruiter-management', '/ai-configuration'];
const platformAdmin = ['/user-management', '/skill-management', '/interview-topic-management', '/company-profile', '/job-category-management', '/ai-usage-logs'];

export const roleProtectedPaths: Record<string, string[]> = {
  recruiter: recruiting,
  org_admin: [...recruiting, ...organizationAdmin],
  admin: [...recruiting, ...organizationAdmin, ...platformAdmin],
  candidate: ['/job-postings', '/my-applications', '/my-cvs', '/profile'],
};
export const privatePaths = [...new Set([...recruiting, ...organizationAdmin, ...platformAdmin, '/my-applications', '/my-cvs', '/profile'])];

export function landingForRole(role?: string): string {
  if (role === 'admin' || role === 'org_admin') return '/department-management';
  if (role === 'recruiter') return '/dashboard';
  if (role === 'candidate') return '/job-postings';
  return '/403';
}

export function mayVisit(role: string | undefined, path: string): boolean {
  return (roleProtectedPaths[role ?? ''] ?? []).some(prefix => path === prefix || path.startsWith(prefix + '/'));
}
