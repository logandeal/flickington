import type { NextApiRequest, NextApiResponse } from "next";
import { MovieProvider } from "../../modules/movie";
import makeTmdbApiHandler from "../../modules/tmdb";

export default makeTmdbApiHandler<MovieProvider>("watch/providers/movie", {
  resultKey: "results",
  transformEach: (item) => {
    if (item.display_priorities.US === undefined) {
      return undefined;
    }
    const displayPriority = item.display_priorities.US;
    return {
      ...item,
      display_priorities: undefined,
      display_priority: displayPriority,
    };
  },
});
