import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListNotesQueryDto, NoteDto } from './note.dto';

const validationErrors = (payload: Record<string, unknown>) =>
  validate(plainToInstance(NoteDto, payload));

describe('NoteDto', () => {
  it('rejects a whitespace-only body', async () => {
    const instance: NoteDto = plainToInstance(NoteDto, { body: '   \n\t ' });

    expect(instance.body).toBe('');
    await expect(validate(instance)).resolves.toEqual([
      expect.objectContaining({
        property: 'body',
        constraints: expect.objectContaining({ isNotEmpty: expect.any(String) }),
      }),
    ]);
  });

  it('accepts 2000 / rejects 2001 characters', async () => {
    await expect(validationErrors({ body: 'a'.repeat(2000) })).resolves.toEqual([]);
    await expect(validationErrors({ body: `  \n${'a'.repeat(2000)}\t  ` })).resolves.toEqual([]);

    const errors = await validationErrors({ body: 'a'.repeat(2001) });

    expect(errors).toEqual([
      expect.objectContaining({
        property: 'body',
        constraints: expect.objectContaining({ maxLength: expect.any(String) }),
      }),
    ]);
  });

  it('trims the body', async () => {
    const instance: NoteDto = plainToInstance(NoteDto, { body: '  \n Ghi chú về ứng viên \t ' });

    expect(instance.body).toBe('Ghi chú về ứng viên');
    await expect(validate(instance)).resolves.toEqual([]);
  });
});

describe('ListNotesQueryDto', () => {
  it('converts page and limit from query strings and rejects 0', async () => {
    const instance: ListNotesQueryDto = plainToInstance(ListNotesQueryDto, { page: '2', limit: '5' });

    expect(instance).toMatchObject({ page: 2, limit: 5 });
    await expect(validate(instance)).resolves.toEqual([]);
    await expect(validate(plainToInstance(ListNotesQueryDto, {}))).resolves.toEqual([]);
    await expect(validate(plainToInstance(ListNotesQueryDto, { page: 1, limit: 1 }))).resolves.toEqual([]);

    for (const field of ['page', 'limit']) {
      for (const value of [0, '0', -1, '-1']) {
        const errors = await validate(plainToInstance(ListNotesQueryDto, { [field]: value }));

        expect(errors).toEqual([
          expect.objectContaining({
            property: field,
            constraints: expect.objectContaining({ min: expect.any(String) }),
          }),
        ]);
      }

      for (const value of [1.5, '1.5', 'invalid']) {
        const errors = await validate(plainToInstance(ListNotesQueryDto, { [field]: value }));

        expect(errors).toEqual([
          expect.objectContaining({
            property: field,
            constraints: expect.objectContaining({ isInt: expect.any(String) }),
          }),
        ]);
      }
    }
  });
});
