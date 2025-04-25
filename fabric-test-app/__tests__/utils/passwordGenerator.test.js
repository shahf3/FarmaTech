const { generatePassword } = require('../../utils/passwordGenerator');

describe('Password Generator', () => {
  test('generates a password of the specified length', () => {
    const length = 12;
    const password = generatePassword(length);
    expect(password.length).toBe(length);
  });

  test('generates a password with default length of 10 when no length is specified', () => {
    const password = generatePassword();
    expect(password.length).toBe(10);
  });

  test('contains at least one uppercase letter', () => {
    const password = generatePassword();
    expect(password).toMatch(/[A-Z]/);
  });

  test('contains at least one lowercase letter', () => {
    const password = generatePassword();
    expect(password).toMatch(/[a-z]/);
  });

  test('contains at least one number', () => {
    const password = generatePassword();
    expect(password).toMatch(/\d/);
  });

  test('contains at least one special character', () => {
    const password = generatePassword();
    expect(password).toMatch(/[@#$%&*!?]/);
  });

  test('does not contain easily confused characters (O, 0, 1, l, I)', () => {
    const password = generatePassword(50);
    expect(password).not.toMatch(/[O0l1I]/);
  });

  test('generates different passwords on consecutive calls', () => {
    const password1 = generatePassword();
    const password2 = generatePassword();
    expect(password1).not.toBe(password2);
  });

  test('handles various length inputs correctly', () => {
    const tooShort = generatePassword(3);
    expect(tooShort.length).toBeGreaterThanOrEqual(4);
    
    const normalLength = generatePassword(16);
    expect(normalLength.length).toBe(16);

    const largeLength = generatePassword(32);
    expect(largeLength.length).toBe(32);
  });
});