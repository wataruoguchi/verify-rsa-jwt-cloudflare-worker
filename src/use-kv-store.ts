export type KVStore = ReturnType<typeof useKVStore>;
const defaultValidator = <T>(value: unknown): value is T =>
  !!value && typeof value === 'object' && Object.keys(value).length > 0;

export function useKVStore(namespace: KVNamespace | undefined) {
  return {
    async get<T>(
      key: string,
      fetcher: () => Promise<T>,
      validator: (value: unknown) => value is T = defaultValidator<T>,
      cacheOptions?: { expirationTtl: number },
    ): Promise<T> {
      if (!namespace) {
        // No cache available, so fetch the value.
        const freshValue = await fetcher();
        if (validator(freshValue)) {
          return freshValue;
        }
        throw new Error('Invalid value: ' + JSON.stringify(freshValue));
      }

      const cachedValue = await namespace.get(key, 'json');
      if (validator(cachedValue)) {
        return cachedValue;
      } else {
        const freshValue = await fetcher();
        if (validator(freshValue)) {
          await namespace.put(key, JSON.stringify(freshValue), {
            expirationTtl: 60 * 60 * 24,
            ...cacheOptions,
          });
          return freshValue;
        }
        throw new Error('Invalid value: ' + JSON.stringify(freshValue));
      }
    },
  };
}
