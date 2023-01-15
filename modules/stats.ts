// Just some functions to get stats from a list of movies.

import { Movie } from "./movie";

export function getProviderTypes(movies: Movie[]) {
  const typeSet = new Set<string>();
  for (const movie of movies) {
    for (const provider of movie.providers) {
      typeSet.add(provider.type);
    }
  }
  return Array.from(typeSet);
}

export function getProviders(movies: Movie[]) {
  const providerMap = new Map<
    number,
    { id: number; name: string; count: number; types: Record<string, number> }
  >();
  for (const movie of movies) {
    const providerSet = new Set<number>();
    for (const provider of movie.providers) {
      const shouldIncrementProviderMovieCount = !providerSet.has(
        provider.provider_id
      );
      providerSet.add(provider.provider_id);
      if (!providerMap.has(provider.provider_id)) {
        providerMap.set(provider.provider_id, {
          id: provider.provider_id,
          count: 0,
          name: provider.provider_name,
          types: {},
        });
      }
      providerMap.get(provider.provider_id)!.types[provider.type] =
        providerMap.get(provider.provider_id)!.types[provider.type] || 0;
      providerMap.get(provider.provider_id)!.types[provider.type]++;
      if (shouldIncrementProviderMovieCount) {
        providerMap.get(provider.provider_id)!.count++;
      }
    }
  }
  return providerMap;
}
