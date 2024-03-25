import { Hono } from 'hono';
import {
  Jwks,
  VerificationResult,
  VerifyRsaJwtEnv,
  getPayloadFromContext,
  verifyRsaJwt,
} from '.';
import { getMockFetcher, mockJwksUri } from '../test-helpers/get-mock-fetcher';
import { getJwk, getToken } from '../test-helpers/pem';

const payloadValidator = ({ payload }: VerificationResult) => {
  if (
    payload &&
    typeof payload === 'object' &&
    'name' in payload &&
    payload.name !== 'Wataru Oguchi'
  ) {
    throw new Error('Who are you!?');
  }
};

describe('Hono Middleware', () => {
  describe.skip('With Cloudflare Workers env values', () => {
    const { VERIFY_RSA_JWT } = getMiniflareBindings();
    const env: VerifyRsaJwtEnv = {
      VERIFY_RSA_JWT,
      VERIFY_RSA_JWT_JWKS_CACHE_KEY: 'jwks-cache-key',
      JWKS_URI: mockJwksUri,
    };

    let hono: Hono<{ Bindings: VerifyRsaJwtEnv }>;

    beforeEach(() => {
      getMockFetcher(); // TODO: Does it work?
      hono = new Hono<{ Bindings: VerifyRsaJwtEnv }>();
      hono.use('/protected', verifyRsaJwt({ verbose: true }));
      hono.get('/protected', (ctx) => ctx.json(getPayloadFromContext(ctx)));
    });

    describe('when the token is valid', () => {
      let response: Response;
      beforeEach(async () => {
        const token = getToken({ name: 'Wataru Oguchi' });
        const req = new Request('http://example.com/protected', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        response = await hono.fetch(req, { env });
      });

      it('should return claims', async () => {
        expect(response.status).toEqual(200); // TODO: It returns 401 - ctx.env.JWKS_URI is undefined. `console.log(ctx.env)` shows the value, but `console.log(ctx.env.JWKS_URI)` shows undefined.
      });
    });
  });

  describe('With the optional configs', () => {
    let hono: Hono;
    let token: string;
    beforeEach(() => {
      const generalKeyValueStore = {
        get: async () => ({ keys: [getJwk()] }),
        put: async () => {},
      };

      hono = new Hono();
      hono.use(
        '/protected/*',
        verifyRsaJwt({
          jwksUri: mockJwksUri,
          kvStore: generalKeyValueStore,
          payloadValidator,
          verbose: false,
        }),
      );
      hono.get('/protected', (ctx) => ctx.json(getPayloadFromContext(ctx)));
      token = getToken({ name: 'Wataru Oguchi' });
    });

    describe('when the token is valid', () => {
      let response: Response;
      describe('and the payload is valid', () => {
        beforeEach(async () => {
          const req = new Request('http://localhost/protected', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          response = await hono.fetch(req);
        });

        it('should return 200', () => {
          expect(response.status).toEqual(200);
        });

        it('should return the claims with this test endpoint', async () => {
          await expect(response.json()).resolves.toEqual({
            name: 'Wataru Oguchi',
            iat: expect.any(Number),
          });
        });
      });

      describe('and the payload is invalid', () => {
        beforeEach(async () => {
          const req = new Request('http://localhost/protected', {
            headers: {
              Authorization: `Bearer ${getToken({ name: 'Yuki the dog' })}`,
            },
          });
          response = await hono.fetch(req);
        });

        it('should return 401', () => {
          expect(response.status).toEqual(401);
        });
      });
    });

    describe('when the token is invalid', () => {
      let response: Response;
      beforeEach(async () => {
        const req = new Request('http://localhost/protected', {
          headers: {
            Authorization: `Bearer ${token}invalid`,
          },
        });
        response = await hono.fetch(req);
      });

      it('should return 401', () => {
        expect(response.status).toEqual(401);
      });
    });
  });

  describe('When the JWKS is given as a config', () => {
    let hono: Hono;
    let token: string;
    let jwks: Jwks;
    beforeEach(() => {
      jwks = { keys: [getJwk()] };

      hono = new Hono();
      hono.use(
        '/protected/*',
        verifyRsaJwt({
          jwksUri: mockJwksUri,
          jwks,
          payloadValidator,
          verbose: false,
        }),
      );
      hono.get('/protected', (ctx) => ctx.json(getPayloadFromContext(ctx)));
      token = getToken({ name: 'Wataru Oguchi' });
    });

    describe('when the token is valid', () => {
      let response: Response;
      describe('and the payload is valid', () => {
        beforeEach(async () => {
          const req = new Request('http://localhost/protected', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          response = await hono.fetch(req);
        });

        it('should return 200', () => {
          expect(response.status).toEqual(200);
        });

        it('should return the claims with this test endpoint', async () => {
          await expect(response.json()).resolves.toEqual({
            name: 'Wataru Oguchi',
            iat: expect.any(Number),
          });
        });
      });

      describe('and the payload is invalid', () => {
        beforeEach(async () => {
          const req = new Request('http://localhost/protected', {
            headers: {
              Authorization: `Bearer ${getToken({ name: 'Yuki the dog' })}`,
            },
          });
          response = await hono.fetch(req);
        });

        it('should return 401', () => {
          expect(response.status).toEqual(401);
        });
      });
    });

    describe('when the token is invalid', () => {
      let response: Response;
      beforeEach(async () => {
        const req = new Request('http://localhost/protected', {
          headers: {
            Authorization: `Bearer ${token}invalid`,
          },
        });
        response = await hono.fetch(req);
      });

      it('should return 401', () => {
        expect(response.status).toEqual(401);
      });
    });
  });
});
