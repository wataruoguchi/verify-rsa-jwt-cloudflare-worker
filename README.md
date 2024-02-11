# verify-rsa-jwt-cloudflare-worker

This is a lightweight library that verifies a JWT (JSON Web Token) signed with RS256. This is built for [Cloudflare Workers](https://workers.cloudflare.com/).

Although, the project itself has no dependencies. If the runtime supports Web Standard APIs, it should just work :tm:

This package includes the Hono Middleware :fire:

It uses [JWKS](https://datatracker.ietf.org/doc/html/rfc7517#section-4) to verify a JWT. To fetch JWKS, you need to provide the JWKs endpoint URL to JWKS_URI.

## Install

```sh
npm install verify-rsa-jwt-cloudflare-worker
```

## Usage

### Module Worker

```ts
import {
  getJwks,
  useKVStore,
  verify,
  VerifyRsaJwtEnv,
} from 'verify-rsa-jwt-cloudflare-worker';

export default {
  async fetch(request: Request, env: VerifyRsaJwtEnv): Promise<Response> {
    const token =
      request.headers.get('Authorization')?.replace(/Bearer\s+/i, '') || '';
    try {
      const jwks = await getJwks(env.JWKS_URI, useKVStore(env.VERIFY_RSA_JWT));
      const { payload } = await verify(token, jwks);
      // Then, you could validate the payload and return a response
      return new Response(JSON.stringify({ payload }), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (error: any) {
      return new Response((error as Error).message, { status: 401 });
    }
  },
};
```

### `wrangler.toml`

```toml
name = "verify-rsa-jwt-cloudflare-worker"
compatibility_date = "2023-05-18"

[vars]
JWKS_URI = "https://<your-authentication-server-host>/.well-known/jwks.json"
VERIFY_RSA_JWT_JWKS_CACHE_KEY = ""

[[kv_namespaces]]
binding = "VERIFY_RSA_JWT"
id = "<ID CREATED BY WRANGLER>"
preview_id = "<ID CREATED BY WRANGLER>"
```

### Use Without a KV Store

If you do not want to use a KV store to cache the JWKS returned by `getJwks()`, you can simply not pass any cache key to `useKVStore()`.

```ts
const jwks = await getJwks(
  'https://<myurl>/.well-known/jwks.json',
  useKVStore() // no cache key
)
```

> [!WARNING]  
> Not caching the JWKS in a KV store will result in longer response times since the JWKS must be refetched on every request.
> It can also lead to request throttling from the JWKS provider if your Worker receives a lot of traffic.

## Hono Middleware

If you are working on a Cloudflare Workers based project, the following parameters can be set via `wrangler.toml`.

### `VerifyRsaJwtEnv`

| Variable                      | Description                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| VERIFY_RSA_JWT                | KVNamespace. It want to store downloaded JWKS                                                                                |
| VERIFY_RSA_JWT_JWKS_CACHE_KEY | Optional string to specify what key we want to sue to store JWKS. Default: `verify-rsa-jwt-cloudflare-worker-jwks-cache-key` |
| JWKS_URI                      | A URI for downloading JWKS. Typically `https://<host>/.well-known/jwks.json`                                                 |

Additionally, or, if you are working on a non-Cloudflare Workers based project, such as Node.js, the following optional config values are available:

### `VerifyRsaJwtConfig`

| Variable         | Description                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| jwksUri          | A URI for downloading JWKS.                                                                                                                |
| kvStore          | Any storage manager that has `get` and `put`. It's used for storing JWKS.                                                                  |
| payloadValidator | Every authentication vendor would configure JWT payload differently. Please give a function that validates the payload and throw an error. |
| verbose          | A debug flag.                                                                                                                              |

### Import

```ts
import { Hono } from 'hono';
import {
  verifyRsaJwt,
  getPayloadFromContext,
} from 'verify-rsa-jwt-cloudflare-worker';
```

### Hono Middleware Usage

```ts
const app = new Hono()

app.use(
  '/auth/*',
  verifyRsaJwt({
    jwksUri: "https://<host>/.well-known/jwks.json",
    kvStore: // Anything that keeps a value, KVNamespace would work too.
    payloadValidator: ({payload, ctx}) => { /* Validate the payload, throw an error if invalid */ },
  })
)

app.get('/auth/page', (c) => {
  const claims = getPayloadFromContext(c)
  return c.text('You are authorized')
})
```

## Test

### Automated tests

Some tests use [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) files to create JWT tokens / imitate JWKS. You need the following setup to prepare them.

1. Create a `.env` file.

   ```sh
   echo PEM_NAME="test-pem" > .env
   ```

1. Run `npm run gen-pem-keys` to generate PEM files.

1. Then, as you may be familiar, test with `npm test`.

### Manual test

For testing through `src/worker.ts`, you can:

1. Launch a local server

   ```sh
   npm run start src/worker.ts
   ```

1. cURL with your JWT!

   ```sh
   url -H "Authorization: Bearer <YOUR-JWT>" http://127.0.0.1:<YOUR-DEV-SERVER-PORT>/
   ```

1. Then, if everything is set correctly, you'd expect to see something like this:

   ```json
   {
     "payload": {
       "iss": " ... ",
       "sub": " ... ",
       "aud": " ... ",
       "iat": 1690401415,
       "exp": 1690487815,
       "azp": " ... ",
       "gty": " ... "
     }
   }
   ```

## Development

### Use Wrangler CLI

Please follow this document. [https://developers.cloudflare.com/workers/get-started/guide/](https://developers.cloudflare.com/workers/get-started/guide/).

### Use `lefthook` (option)

Please run `lefthook install` before creating a PR.

## Learn more about Authentication

[Auth0](https://auth0.com/docs) provides amazing documents.
