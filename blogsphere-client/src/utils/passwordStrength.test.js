import { passwordStrength } from './passwordStrength';

test('short passwords are flagged', () => {
  expect(passwordStrength('').score).toBe(0);
  expect(passwordStrength('abc1!').label).toBe('Too short');
});

test('common or repetitive passwords are weak', () => {
  expect(passwordStrength('password123').label).toBe('Weak');
  expect(passwordStrength('aaaaaaaaaaaa').label).toBe('Weak');
});

test('longer mixed passwords score higher', () => {
  expect(passwordStrength('lowercase only').score).toBeLessThan(passwordStrength('Mixed-Case-Pass-2024').score);
  expect(passwordStrength('Mixed-Case-Pass-2024').label).toBe('Strong');
});
