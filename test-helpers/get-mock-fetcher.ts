export const mockOrigin = 'https://example.com';
export const mockPath = '/.well-known/jwks.json';
export const mockJwksUri = `${mockOrigin}${mockPath}`;

export function getMockFetcher<T>() {
  // Get correctly set up `MockAgent`
  const fetchMock = getMiniflareFetchMock();

  // Throw when no matching mocked request is found
  // (see https://undici.nodejs.org/#/docs/api/MockAgent?id=mockagentdisablenetconnect)
  fetchMock.disableNetConnect();

  // Mock request to https://example.com/thing
  // (see https://undici.nodejs.org/#/docs/api/MockAgent?id=mockagentgetorigin)
  const origin = fetchMock.get(mockOrigin);
  return (ok: boolean, json: T): void => {
    // (see https://undici.nodejs.org/#/docs/api/MockPool?id=mockpoolinterceptoptions)
    // There is no way that I can set 'ok' property with this library. Use status code instead.
    origin
      .intercept({ method: 'GET', path: mockPath })
      .reply(ok ? 200 : 401, JSON.stringify(json));
  };
}
