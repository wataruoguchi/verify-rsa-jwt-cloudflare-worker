# verify-rsa-jwt-cloudflare-worker

This is a lightweight library that verifies a JWT (JSON Web Token) signed with RS256. This is built for [Cloudflare Workers](https://workers.cloudflare.com/).

## Install

```sh
npm install verify-rsa-jwt-cloudflare-worker
```

## Usage

It uses [JWKS](https://datatracker.ietf.org/doc/html/rfc7517#section-4) to verify a JWT. To fetch JWKS, you need to provide the JWKs endpoint URL to JWKS_URI.

```ts
import { getJwks, useKVStore, verify, VerifyRsaJwtEnv } from 'verify-rsa-jwt-cloudflare-worker';

export default {
  async fetch(request: Request, env: VerifyRsaJwtEnv): Promise<Response> {
    const token = request.headers.get('Authorization')?.replace(/Bearer\s+/i, '') || '';
    try {
      const jwks = await getJwks(env.JWKS_URI, useKVStore(env.VERIFY_RSA_JWT));
      const { payload } = await verify(token, jwks);
      // Then, you could validate the payload and return a response
      return new Response(JSON.stringify({ payload }), { headers: { 'content-type': 'application/json' } });
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

[[kv_namespaces]]
binding = "VERIFY_RSA_JWT"
id = "<ID CREATED BY WRANGLER>"
preview_id = "<ID CREATED BY WRANGLER>"
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
    {"payload":{"iss":" ... ","sub":" ... ","aud":" ... ","iat":1690401415,"exp":1690487815,"azp":" ... ","gty":" ... "}}
    ```

## Development

### Use Wrangler CLI

Please follow this document. [https://developers.cloudflare.com/workers/get-started/guide/](https://developers.cloudflare.com/workers/get-started/guide/).

## Learn more about Authentication

[Auth0](https://auth0.com/docs) provides amazing documents.
