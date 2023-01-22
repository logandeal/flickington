import type { NextApiRequest, NextApiResponse } from "next";

export function getTmdbUrl(
  path: string,
  parameters: Record<string, string> = {}
) {
  return (
    `https://api.themoviedb.org/3/${path}?api_key=${process.env.TMDB_API_KEY}&language=en-US` +
    Object.keys(parameters).map((key) => `&${key}=${parameters[key]}`)
  );
}

export default function makeTmdbApiHandler<T>(
  path: string,
  {
    resultKey,
    transform = (result) => result,
    transformEach = (item) => item,
  }: {
    resultKey?: string;
    transform?: (item: any) => any;
    transformEach?: (item: any) => T;
  } = {}
) {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<T[]>
  ) {
    const response = await fetch(getTmdbUrl(path));
    const data = await response.json();
    const items = transform(resultKey ? data[resultKey] : data);
    res.status(200).json(items.map(transformEach).filter(Boolean));
  };
}
