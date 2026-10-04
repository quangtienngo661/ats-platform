// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatSalaryInput, parseSalaryInput } from './salary-input';

describe('parseSalaryInput (E15)', () => {
  it.each([
    ['15000000', 15_000_000],
    ['15.000.000', 15_000_000],
    ['15,000,000', 15_000_000],
    ['12 000 000', 12_000_000],
    ['  12000000 ', 12_000_000],
    ['1.000', 1_000],
    ['0', 0],
  ])('reads %j as %d', (text, value) => {
    expect(parseSalaryInput(text)).toBe(value);
  });

  it.each(['', '   '])('treats an empty field %j as "no value"', (text) => {
    expect(parseSalaryInput(text)).toBeNull();
  });

  it.each([
    ['letters', 'abc'],
    ['a negative number', '-5'],
    ['a decimal, which would otherwise be read as thousands', '1.5'],
    ['mixed separators', '1.000,000'],
    ['a misplaced separator', '15.00.000'],
    ['a number too large to hold exactly', '99999999999999999999'],
  ])('refuses %s', (_case, text) => {
    expect(parseSalaryInput(text)).toBe('invalid');
  });
});

describe('formatSalaryInput', () => {
  it.each([
    [15_000_000, '15.000.000'],
    [1_000, '1.000'],
    [999, '999'],
    [0, '0'],
  ])('writes %d as %j', (value, text) => {
    expect(formatSalaryInput(value)).toBe(text);
  });

  it('round-trips with parseSalaryInput', () => {
    expect(parseSalaryInput(formatSalaryInput(12_345_678))).toBe(12_345_678);
  });
});
