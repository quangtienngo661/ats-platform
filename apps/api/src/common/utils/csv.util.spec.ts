import { toCsv } from './csv.util';

describe('toCsv', () => {
  it('starts with a UTF-8 BOM and ends every record with CRLF', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toBe(
      '\uFEFF"a","b"\r\n"1","2"\r\n',
    );
  });

  it('quotes every cell and doubles inner quotes', () => {
    expect(toCsv(['name'], [['Nguyễn "Tí"']])).toBe(
      '\uFEFF"name"\r\n"Nguyễn ""Tí"""\r\n',
    );
  });

  it('keeps a comma and a line break inside one cell', () => {
    const csv = toCsv(['comma', 'lineBreak'], [['a, b', 'line1\nline2']]);

    expect(csv).toBe(
      '\uFEFF"comma","lineBreak"\r\n"a, b","line1\nline2"\r\n',
    );
    expect(csv.split('\r\n')).toHaveLength(3);
  });

  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx', '\nx'])(
    'neutralises %j with a leading tab inside the quotes',
    (value) => {
      const expected: Record<string, string> = {
        '=1+1': '\uFEFF"value"\r\n"\t=1+1"\r\n',
        '+1': '\uFEFF"value"\r\n"\t+1"\r\n',
        '-1': '\uFEFF"value"\r\n"\t-1"\r\n',
        '@SUM(A1)': '\uFEFF"value"\r\n"\t@SUM(A1)"\r\n',
        '\tx': '\uFEFF"value"\r\n"\t\tx"\r\n',
        '\rx': '\uFEFF"value"\r\n"\t\rx"\r\n',
        '\nx': '\uFEFF"value"\r\n"\t\nx"\r\n',
      };

      expect(toCsv(['value'], [[value]])).toBe(expected[value]);
    },
  );

  it('writes null and undefined as empty cells', () => {
    expect(toCsv(['a', 'b'], [[null, undefined]])).toBe(
      '\uFEFF"a","b"\r\n"",""\r\n',
    );
  });

  it('keeps Vietnamese text unchanged', () => {
    expect(
      toCsv(['Kỹ năng khớp', 'Trạng thái'], [['Tiếng Việt', 'Đã tuyển']]),
    ).toBe('\uFEFF"Kỹ năng khớp","Trạng thái"\r\n"Tiếng Việt","Đã tuyển"\r\n');
  });

  it('writes numbers as strings and does not prefix values starting with a letter', () => {
    expect(toCsv(['score', 'name'], [[82.5, 'Alice=1+1']])).toBe(
      '\uFEFF"score","name"\r\n"82.5","Alice=1+1"\r\n',
    );
  });
});
