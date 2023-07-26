import type { KVStore } from './use-kv-store';
import { useKVStore } from './use-kv-store';
const { TEST_NAMESPACE } = getMiniflareBindings();

TEST_NAMESPACE.get = jest.fn();
TEST_NAMESPACE.put = jest.fn();

type DataType = { key: string };

const mockResponseError = new Error('Invalid value from createMockResponse');
// Helper function to create a mock response for fetcher function
const createMockResponse = (data: DataType | null, isValid: boolean) => () => {
  return new Promise<DataType>((resolve, reject) => {
    setTimeout(() => {
      if (isValid) {
        resolve(data as DataType);
      } else {
        reject(mockResponseError);
      }
    }, 100);
  });
};

describe('useKVStore', () => {
  let kvStore: KVStore;

  beforeEach(() => {
    // Create a fresh instance of KVStore before each test
    kvStore = useKVStore(TEST_NAMESPACE);
  });

  afterEach(() => {
    // Reset mock function calls after each test
    jest.clearAllMocks();
  });

  const customValidator = (value: unknown): value is DataType =>
    !!value && typeof value === 'object' && 'key' in value;
  describe.each([
    { name: 'default', validator: undefined },
    { name: 'custom', validator: customValidator },
  ])('with the $name validator', ({ validator }) => {
    let result: DataType;
    let mockCachedValue: DataType;
    let mockFetcher: () => Promise<DataType>;

    describe('cached value is valid', () => {
      beforeEach(async () => {
        // Mock the get method to return a valid cached value
        mockCachedValue = { key: 'value' };
        TEST_NAMESPACE.get.mockResolvedValueOnce(mockCachedValue);

        // Mock the fetcher function (shouldn't be called since the value is cached)
        mockFetcher = jest.fn();

        // Call the get method with a valid validator
        result = await kvStore.get<DataType>(
          'test-key',
          mockFetcher,
          validator,
        );
      });

      it('should return value from cache', () => {
        expect(result).toEqual(mockCachedValue);
      });

      it('should not call the fetcher', () => {
        expect(mockFetcher).not.toHaveBeenCalled();
      });
    });

    describe('cached value is invalid', () => {
      beforeEach(async () => {
        // Mock the get method to return an invalid cached value
        TEST_NAMESPACE.get.mockResolvedValueOnce({});

        // Mock the fetcher function to return a valid value
        const mockData: DataType = { key: 'value' };
        mockFetcher = createMockResponse(mockData, true);

        // Call the get method with a valid validator
        result = await kvStore.get<DataType>(
          'test-key',
          mockFetcher,
          validator,
        );
      });

      it('should return value from fetcher', () => {
        expect(result).toEqual({ key: 'value' });
      });

      it('should cache the value', () => {
        expect(TEST_NAMESPACE.put).toHaveBeenCalledWith(
          'test-key',
          JSON.stringify({ key: 'value' }),
          {
            expirationTtl: 60 * 60 * 24,
          },
        );
      });
    });
  });

  describe('when the fetcher throws an error', () => {
    let mockFetcher: () => Promise<DataType>;

    beforeEach(() => {
      // Mock the get method to return an invalid cached value
      TEST_NAMESPACE.get.mockResolvedValueOnce('Invalid value');

      // Mock the fetcher function to return an invalid value
      mockFetcher = createMockResponse(null, false);
    });

    it('should throw an error', async () => {
      // Call the get method with an invalid validator
      await expect(kvStore.get('test-key', mockFetcher)).rejects.toThrow(
        mockResponseError.message,
      );
    });
  });

  describe('when both cached and fetched values are invalid', () => {
    let mockFetcher: () => Promise<DataType>;

    beforeEach(() => {
      // Mock the get method to return an invalid cached value
      TEST_NAMESPACE.get.mockResolvedValueOnce('Malicious value');

      // Mock the fetcher function to return an invalid value
      mockFetcher = createMockResponse(null, true);
    });

    it('should throw an error', async () => {
      // Call the get method with an invalid validator
      await expect(kvStore.get('test-key', mockFetcher)).rejects.toThrow(
        'Invalid value: null',
      );
    });
  });
});
