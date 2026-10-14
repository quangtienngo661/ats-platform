import {
  applicationIncludeOptions,
  candidateHistorySelect,
  candidateScheduleSelect,
} from '../../common/utils/include-options.util';

function findKeyPaths(value: unknown, key: string, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [];

  const paths: string[] = [];
  for (const [name, nested] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (name === key) paths.push(path);
    paths.push(...findKeyPaths(nested, key, path));
  }
  return paths;
}

describe('candidate payload evaluation fields', () => {
  it('the candidate schedule select and application select carry neither scorecard nor notes', () => {
    // The application list/detail assemble their final includes inline in the
    // service. Check their exported inputs without recreating those includes.
    const selections = {
      candidateScheduleSelect,
      applicationIncludeOptions,
      candidateHistorySelect,
    };
    const forbiddenKeys = ['scorecard', 'scorecards', 'notes'];

    for (const [selection, value] of Object.entries(selections)) {
      const forbiddenKeyPaths = forbiddenKeys.flatMap((key) =>
        findKeyPaths(value, key),
      );
      expect({ selection, forbiddenKeyPaths }).toEqual({
        selection,
        forbiddenKeyPaths: [],
      });
    }
  });

  it('finds existing keys in every exported input, including nested selects', () => {
    expect(findKeyPaths(candidateScheduleSelect, 'interviewId')).toContain('interviewId');
    expect(findKeyPaths(candidateScheduleSelect, 'name')).toContain(
      'application.select.jobPosting.select.organization.select.name',
    );
    expect(findKeyPaths(applicationIncludeOptions, 'status')).toContain(
      'screening.select.status',
    );
    expect(findKeyPaths(candidateHistorySelect, 'toStatus')).toContain('toStatus');
  });
});
