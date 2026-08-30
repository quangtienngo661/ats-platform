import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CVsController } from './cvs.controller';
import { mockRequest, mockResponse } from '../../test-utils/unit-test-helpers';

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

describe('CVsController', () => {
  let service: any;
  let controller: CVsController;

  beforeEach(() => {
    service = {
      uploadCV: jest.fn(),
      getMyCVs: jest.fn(),
      getCVById: jest.fn(),
      getParsedData: jest.fn(),
      downloadCV: jest.fn(),
      confirmCV: jest.fn(),
      deleteCV: jest.fn(),
      resolveCandidateIdByUserId: jest.fn(),
    };
    controller = new CVsController(service);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  it('resolves candidate id for self-service CV endpoints', async () => {
    service.resolveCandidateIdByUserId.mockResolvedValue('cand-1');
    const req = mockRequest({ userId: 'user-1' });

    await controller.getMyCVs(req);
    await controller.confirmCV(req, 'cv-1', true, true);
    await controller.deleteCV(req, 'cv-1');

    expect(service.getMyCVs).toHaveBeenCalledWith('cand-1');
    expect(service.confirmCV).toHaveBeenCalledWith('cv-1', 'cand-1', true, true);
    expect(service.deleteCV).toHaveBeenCalledWith('cv-1', 'cand-1');
  });

  it('uploads with resolved candidate id and cleans up on failure', async () => {
    service.resolveCandidateIdByUserId.mockResolvedValue('cand-1');
    service.uploadCV.mockRejectedValue(new Error('parse failed'));

    await expect(
      controller.uploadCV(
        mockRequest({ userId: 'user-1' }),
        { path: 'tmp/cv.pdf' } as any,
        { fileName: 'cv.pdf' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fs.unlink).toHaveBeenCalledWith('tmp/cv.pdf');
  });

  it('throws when current user has no candidate profile', async () => {
    service.resolveCandidateIdByUserId.mockRejectedValue(new NotFoundException('Không tìm thấy hồ sơ ứng viên'));

    await expect(controller.getMyCVs(mockRequest({ userId: 'user-1' }))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('downloads the physical CV file through Express response', async () => {
    service.downloadCV.mockResolvedValue({ absolutePath: 'abs/cv.pdf', fileName: 'cv.pdf' });
    const res = mockResponse();

    await controller.downloadCV('cv-1', 'alice', res);

    expect(res.download).toHaveBeenCalledWith('abs/cv.pdf', 'alice Resume.pdf');
  });
});
