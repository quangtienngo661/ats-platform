import 'reflect-metadata';
import { UserRole } from '@ats-platform/database';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { ApplicationNotesController } from '../application-notes/application-notes.controller';
import { ApplicationsController } from '../applications/applications.controller';
import { InterviewScorecardsController } from './interview-scorecards.controller';

function getRouteHandlers(controller: { prototype: object }) {
  return Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => ({
      name,
      handler: Object.getOwnPropertyDescriptor(controller.prototype, name)?.value,
    }))
    .filter(
      ({ handler }) =>
        typeof handler === 'function' &&
        Reflect.getMetadata(PATH_METADATA, handler) !== undefined,
    );
}

function readRoles(controller: object, handler: object): unknown {
  // RolesGuard's getAllAndOverride checks the handler before the class and
  // falls back only for undefined metadata. Missing metadata allows every role.
  const roles = Reflect.getMetadata(ROLES_KEY, handler);
  return roles !== undefined ? roles : Reflect.getMetadata(ROLES_KEY, controller);
}

describe('candidate access to evaluation routes', () => {
  it('no route of the scorecard, note and comparison controllers allows the candidate role', () => {
    const controllers = [
      { controller: InterviewScorecardsController, expectedCount: 3 },
      { controller: ApplicationNotesController, expectedCount: 4 },
    ];
    const routes: { controller: object; handler: object; route: string }[] =
      controllers.flatMap(({ controller, expectedCount }) => {
        const handlers = getRouteHandlers(controller);
        expect(handlers).toHaveLength(expectedCount);
        return handlers.map(({ name, handler }) => ({
          controller,
          handler,
          route: `${controller.name}.${name}`,
        }));
      });

    const comparisonHandler = ApplicationsController.prototype.compareApplications;
    expect(Reflect.getMetadata(PATH_METADATA, comparisonHandler)).toBeDefined();
    routes.push({
      controller: ApplicationsController,
      handler: comparisonHandler,
      route: 'ApplicationsController.compareApplications',
    });

    for (const { controller, handler, route } of routes) {
      const roles = readRoles(controller, handler);
      expect(roles).toBeDefined();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles).not.toHaveLength(0);
      expect(roles).not.toContain(UserRole.candidate);
      expect(roles).not.toContain(UserRole.org_admin);
      expect({ route, roles }).toEqual({
        route,
        roles: [UserRole.recruiter, UserRole.admin],
      });
    }
  });

  it('reads the candidate role on the existing apply route', () => {
    const handler = ApplicationsController.prototype.apply;
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBeDefined();
    expect(readRoles(ApplicationsController, handler)).toContain(UserRole.candidate);
  });
});
