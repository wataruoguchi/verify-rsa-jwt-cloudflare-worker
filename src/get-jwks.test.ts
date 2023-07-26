import { getMockFetcher, mockJwksUri } from '../test-helpers/get-mock-fetcher';
import type { Jwks } from './get-jwks';
import { getJwks } from './get-jwks';
import { KVStore, useKVStore } from './use-kv-store';

// Mock the KVStore
const { TEST_NAMESPACE } = getMiniflareBindings();
TEST_NAMESPACE.get = jest.fn();
TEST_NAMESPACE.put = jest.fn();

const mockFetcher = getMockFetcher<Jwks>();
describe('getJwks', () => {
  let kvStore: KVStore;

  beforeEach(() => {
    // Create a fresh instance of KVStore before each test
    kvStore = useKVStore(TEST_NAMESPACE);
  });

  afterEach(() => {
    // Reset mock function calls after each test
    jest.clearAllMocks();
  });

  describe('cached value is valid', () => {
    let mockCachedJwks: Jwks;
    let result: Jwks;

    beforeEach(async () => {
      // Mock the get method to return a valid cached JWKs
      mockCachedJwks = { keys: [{ kty: 'RSA' }] };
      TEST_NAMESPACE.get.mockResolvedValueOnce(mockCachedJwks);

      // Call the getJwks function
      result = await getJwks(mockJwksUri, kvStore);
    });

    it('should return JWKs from cache when valid', () => {
      expect(result).toEqual(mockCachedJwks);
    });

    it('should get JWKs from cache (KV)', () => {
      expect(TEST_NAMESPACE.get).toHaveBeenCalled();
    });

    it('should not try caching (fetching JWKs)', () => {
      expect(TEST_NAMESPACE.put).not.toHaveBeenCalled();
    });
  });

  describe('cached value is invalid', () => {
    let mockFetchedJwks: Jwks;
    let result: Jwks;

    beforeEach(() => {
      // Mock the get method to return an invalid cached JWKs
      TEST_NAMESPACE.get.mockResolvedValueOnce({ keys: 'not-an-array' });
    });

    describe('fetch succeeds', () => {
      beforeEach(async () => {
        // Mock the fetchJwks function to return a valid JWKs
        mockFetchedJwks = { keys: [{ kty: 'RSA' }] };
        mockFetcher(true, mockFetchedJwks);

        // Call the getJwks function
        result = await getJwks(mockJwksUri, kvStore);
      });

      it('should fetch JWKs', () => {
        expect(result).toEqual(mockFetchedJwks);
      });

      it('should cache JWKs', () => {
        expect(TEST_NAMESPACE.put).toHaveBeenCalledWith(
          'PUB_JWKS',
          JSON.stringify(mockFetchedJwks),
          {
            expirationTtl: 60 * 60 * 24,
          },
        );
      });
    });

    describe('fetch fails', () => {
      beforeEach(async () => {
        // Mock the fetchJwks function to return a valid JWKs
        mockFetchedJwks = { keys: [{ kty: 'RSA' }] };
        // "false" means the fetch will fail
        mockFetcher(false, mockFetchedJwks);
      });

      it('should throw an error', async () => {
        await expect(getJwks(mockJwksUri, kvStore)).rejects.toThrow(
          /^Failed to fetch JWKs/,
        );
      });

      it('should not cache JWKs', () => {
        expect(TEST_NAMESPACE.put).not.toHaveBeenCalled();
      });
    });
  });
});
