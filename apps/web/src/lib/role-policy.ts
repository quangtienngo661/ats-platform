/** Navigation hints; the API remains the authority and resolves scope from DB. */
// The online interview room is the one page both sides use (GĐ4); the API decides who is in the interview.
const interviewRoom = '/interview-room';
const recruiting = ['/dashboard', '/jobs', '/interviews', '/my-profile', interviewRoom];
const organizationAdmin = ['/department-management', '/recruiter-management', '/ai-configuration'];
const platformAdmin = ['/user-management', '/skill-management', '/interview-topic-management', '/company-profile', '/job-category-management', '/ai-usage-logs'];

export const roleProtectedPaths: Record<string, string[]> = {
  recruiter: recruiting,
  org_admin: [...recruiting, ...organizationAdmin],
  admin: [...recruiting, ...organizationAdmin, ...platformAdmin],
  candidate: ['/job-postings', '/my-applications', '/my-interviews', '/my-cvs', '/profile', interviewRoom],
};
export const privatePaths = [...new Set([...recruiting, ...organizationAdmin, ...platformAdmin, '/my-applications', '/my-interviews', '/my-cvs', '/profile', interviewRoom])];

export function landingForRole(role?: string): string {
  if (role === 'admin' || role === 'org_admin') return '/department-management';
  if (role === 'recruiter') return '/dashboard';
  if (role === 'candidate') return '/job-postings';
  return '/403';
}

export function mayVisit(role: string | undefined, path: string): boolean {
  return (roleProtectedPaths[role ?? ''] ?? []).some(prefix => path === prefix || path.startsWith(prefix + '/'));
}
