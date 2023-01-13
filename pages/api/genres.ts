import type { NextApiRequest, NextApiResponse } from "next";
import { MovieGenre } from "../../modules/movie";
import makeTmdbApiHandler from "../../modules/tmdb";

export default makeTmdbApiHandler<MovieGenre>("genre/movie/list", {
  resultKey: "genres",
});
