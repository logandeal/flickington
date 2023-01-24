import type { NextApiRequest, NextApiResponse } from "next";
import { MovieProvider } from "../../modules/movie";
import makeTmdbApiHandler from "../../modules/tmdb";

const validProviderIdSet = new Set([
  8, 9, 11, 12, 14, 15, 25, 34, 37, 43, 73, 78, 83, 87, 99, 100, 123, 143, 151,
  157, 175, 185, 188, 190, 191, 192, 196, 197, 199, 201, 202, 203, 204, 207,
  209, 211, 212, 215, 218, 235, 241, 247, 248, 251, 254, 255, 257, 258, 259,
  260, 261, 262, 268, 269, 275, 278, 279, 281, 283, 284, 288, 289, 290, 291,
  292, 293, 294, 295, 299, 300, 309, 315, 322, 331, 332, 337, 343, 344, 350,
  355, 358, 361, 363, 368, 384, 386, 387, 397, 417, 430, 432, 433, 438, 439,
  444, 445, 446, 454, 455, 457, 464, 470, 471, 473, 475, 486, 503, 504, 506,
  507, 514, 520, 521, 526, 528, 529, 531, 532, 534, 538, 546, 551, 554, 559,
  567, 569, 575, 579, 581, 582, 583, 585, 613, 617, 632, 633, 634, 635, 636,
  638, 677, 688, 692, 701, 1759, 1770, 1771, 1793, 1794, 1796, 1811, 1825, 1832,
]);

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
      is_valid: validProviderIdSet.has(item.provider_id),
    };
  },
});
