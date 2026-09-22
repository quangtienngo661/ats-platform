/**
 * The screening config every organization starts with. Screening falls back to an
 * organization's default when a recruiter names none (CvScreeningsService
 * .getActiveConfig), so an organization without one cannot screen at all.
 *
 * One source for both places that create it: a new organization (OrganizationsService)
 * and the boot-time safety net for any organization still missing one (AdminSeedService).
 */
export const defaultAiConfigData = () => ({
  name: process.env.AI_DEFAULT_CONFIG_NAME || 'Default CV Screening Config',
  isDefault: true,
  skillsWeight: 0.5,
  experienceWeight: 0.3,
  educationWeight: 0.2,
  minimumScoreThreshold: 60,
});
