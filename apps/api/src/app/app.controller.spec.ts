import { AppController } from './app.controller';

describe('AppController', () => {
  it('delegates root data to AppService', () => {
    const appService = { getData: jest.fn().mockReturnValue({ message: 'ok' }) };
    const controller = new AppController(appService as any);

    expect(controller.getData()).toEqual({ message: 'ok' });
    expect(appService.getData).toHaveBeenCalled();
  });
});
