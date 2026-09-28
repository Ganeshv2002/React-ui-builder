import { describe, it, expect } from 'vitest';
import { evaluateConditions, validateValue } from '../conditions';

describe('show/disable conditions', () => {
  it('returns null when nothing is configured, including half-filled rows', () => {
    expect(evaluateConditions('', {})).toBeNull();
    expect(evaluateConditions([{ field: '', operator: 'equals', value: 'x' }], {})).toBeNull();
  });
  it('treats AND as binding tighter than OR', () => {
    const rules = JSON.stringify([
      { field: 'a', operator: 'equals', value: '1' },
      { field: 'b', operator: 'equals', value: '2', logicalOperator: 'AND' },
      { field: 'c', operator: 'not_empty', logicalOperator: 'OR' },
    ]);
    expect(evaluateConditions(rules, { a: '1', b: '2' })).toBe(true);
    expect(evaluateConditions(rules, { a: '1', b: '3' })).toBe(false);
    expect(evaluateConditions(rules, { a: '0', c: 'yes' })).toBe(true);
  });
  it('supports every operator the builder offers', () => {
    const check = (operator, actual, value) => evaluateConditions([{ field: 'f', operator, value }], { f: actual });
    expect(check('equals', true, 'true')).toBe(true);
    expect(check('equals', '10', '10.0')).toBe(true);
    expect(check('not_contains', 'hello', 'z')).toBe(true);
    expect(check('starts_with', 'hello', 'he')).toBe(true);
    expect(check('ends_with', 'hello', 'lo')).toBe(true);
    expect(check('greater_equal', '5', '5')).toBe(true);
    expect(check('less_equal', '6', '5')).toBe(false);
    expect(check('greater_than', '', '0')).toBe(false);
    expect(check('in', 'b', 'a, b')).toBe(true);
    expect(check('empty', '', '')).toBe(true);
    expect(check('not_empty', false, '')).toBe(false);
  });
});

describe('validation rules', () => {
  it('returns the first failing message and skips format rules on empty values', () => {
    const rules = [{ type: 'required', message: 'Needed' }, { type: 'minLength', value: '3' }, { type: 'email' }];
    expect(validateValue(rules, '')).toBe('Needed');
    expect(validateValue(rules, 'ab')).toBe('Minimum length is 3');
    expect(validateValue(rules, 'abc')).toBe('Enter a valid email');
    expect(validateValue(rules, 'a@b.co')).toBeNull();
    expect(validateValue([{ type: 'email' }], '')).toBeNull();
  });
  it('checks numbers, urls, integers and custom patterns', () => {
    expect(validateValue([{ type: 'min', value: '18' }], '17')).toBe('Minimum value is 18');
    expect(validateValue([{ type: 'max', value: '10' }], 'abc')).toBe('Maximum value is 10');
    expect(validateValue([{ type: 'url' }], 'example.com')).toBe('Enter a valid url');
    expect(validateValue([{ type: 'integer' }], '4.5')).toBe('Enter a valid integer');
    expect(validateValue([{ type: 'custom', value: '^[A-Z]', message: 'Start with a capital' }], 'ada')).toBe('Start with a capital');
    expect(validateValue([{ type: 'pattern', value: '(' }], 'x')).toBeNull();
  });
});
