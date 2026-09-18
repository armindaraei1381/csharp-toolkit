'use babel';

import Validator from '../lib/core/csharp-validator';

describe('CSharpValidator', () => {
  describe('valid identifiers', () => {
    it('accepts ordinary names', () => {
      for (const name of ['MyClass', '_private', 'x1', 'Ünïcode', 'کلاس']) {
        expect(Validator.validate(name).valid).toBe(true);
      }
    });

    it('is case-sensitive with keywords', () => {
      expect(Validator.validate('Class').valid).toBe(true);
      expect(Validator.validate('class').valid).toBe(false);
    });

    it('accepts verbatim identifiers', () => {
      const result = Validator.validate('@class');
      expect(result.valid).toBe(true);
      expect(result.verbatim).toBe(true);
    });
  });

  describe('invalid identifiers', () => {
    it('rejects empty input', () => {
      expect(Validator.validate('').reason).toBe('empty');
      expect(Validator.validate('   ').reason).toBe('empty');
    });

    it('rejects a leading digit', () => {
      expect(Validator.validate('1Class').reason).toBe('start');
    });

    it('rejects illegal characters', () => {
      expect(Validator.validate('My-Class').reason).toBe('char');
      expect(Validator.validate('My Class').reason).toBe('char');
    });

    it('rejects characters illegal in file names with a clear reason', () => {
      expect(Validator.validate('My:Class').reason).toBe('filename');
    });

    it('rejects reserved keywords', () => {
      for (const name of ['class', 'int', 'namespace', 'string']) {
        const result = Validator.validate(name);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('reserved');
      }
    });

    it('rejects contextual keywords with a distinct reason', () => {
      for (const name of ['var', 'value', 'async']) {
        const result = Validator.validate(name);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('contextual');
      }
    });
  });

  describe('isReserved()', () => {
    it('is case-insensitive', () => {
      expect(Validator.isReserved('VOID')).toBe(true);
      expect(Validator.isReserved('myVoid')).toBe(false);
    });
  });
});
