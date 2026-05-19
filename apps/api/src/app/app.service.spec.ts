import { AppService } from './app.service';

describe('AppService', () => {
  it('returns the API health payload', () => {
    expect(new AppService().getData()).toEqual({ message: expect.any(String) });
  });
});
