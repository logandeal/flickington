// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  MovieNotFoundError,
  getMovieWithProvidersById,
  Movie,
  getLatestMovie,
} from '../../modules/movie';

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const MAX_ATTEMPT_COUNT = 25;

async function getRandomMovie(
  maxId: number,
  attemptCount: number = 0
): Promise<Movie> {
  const movieId = getRandomInt(maxId) + 1;

  try {
    const movie = await getMovieWithProvidersById(movieId);

    if (movie.adult) {
      return getRandomMovie(maxId, attemptCount + 1);
    }

    movie.release_date = movie.release_date
      ? movie.release_date.replace('-', '/')
      : '';

    return movie;
  } catch (e) {
    if (e instanceof MovieNotFoundError) {
      if (attemptCount >= MAX_ATTEMPT_COUNT) {
        throw new Error('Too many attempts to find random movie.');
      }
      return getRandomMovie(maxId, attemptCount + 1);
    }
    throw e;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Movie>
) {
  const latestMovieId = (await getLatestMovie()).id;
  const movie = await getRandomMovie(latestMovieId);

  res.status(200).json(movie);
}
