import { getJwk, getToken } from '../test-helpers/pem';
import type { Jwks } from './get-jwks';
import type { VerificationResult } from './verify';
import { verify } from './verify';

describe('verify', () => {
  const payload = { name: 'Wataru Oguchi' };
  const token = getToken(payload);
  const jwks: Jwks = { keys: [getJwk()] };

  describe('when the token is valid', () => {
    let result: VerificationResult;

    beforeEach(async () => {
      result = await verify(token, jwks);
    });

    it('should return claims', () => {
      expect(result).toEqual({
        payload: { iat: expect.any(Number), ...payload },
      });
    });
  });

  describe('when the token is invalid', () => {
    let result: VerificationResult;

    beforeEach(async () => {
      result = await verify(`${token}invalid`, jwks);
    });

    it('should return payload that has null', () => {
      expect(result).toEqual({ payload: null });
    });
  });
});
