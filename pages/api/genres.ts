import type { NextApiRequest, NextApiResponse } from "next";
import { MovieGenre } from "../../modules/movie";
import makeHandler from "../../modules/makeHandler";

export default makeHandler<MovieGenre>("genre/movie/list", {
  resultKey: "genres",
});
