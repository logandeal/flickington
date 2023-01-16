import type { NextApiRequest, NextApiResponse } from "next";
import { MovieGenre } from "../../modules/movie";
import makeTmdbApiHandler from "../../modules/tmdb";

export default makeTmdbApiHandler<MovieGenre>("genre/movie/list", {
  resultKey: "genres",
  transform: (genres: MovieGenre[]) => {
    const genresAndPairs = genres.concat([
      {
        id: 35,
        pair_id: 10749,
        name: "Romantic Comedy",
      },
      {
        id: 18,
        pair_id: 35,
        name: "Dramedy",
      },
      {
        id: 28,
        pair_id: 35,
        name: "Action Comedy",
      },
    ]);
    return genresAndPairs.sort((a, b) => a.name.localeCompare(b.name));
  },
});
