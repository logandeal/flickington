import fs from "fs";
import commander, { Option, program } from "commander";
import { isValidProviderType, Movie } from "../modules/movie";

function parseNumberOption(value: string): number {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }
  return parsedValue;
}

program.option("-f, --file <string>", "File to read");

program.parse();

import { getProviders } from "../modules/stats";

function printProviders(providersMap: ReturnType<typeof getProviders>) {
  console.info("Providers:\n");
  const sortedProviders = [...providersMap.values()].sort(
    (a, b) => b.count - a.count
  );
  for (const provider of sortedProviders) {
    if (provider) {
      console.info(`${provider.name} (${provider.id}): ${provider.count}`);
      for (const type of Object.keys(provider.types)) {
        console.info(`  ${type}: ${provider.types[type]}`);
      }
    }
  }

  const validProviders = [...providersMap.values()].filter((provider) =>
    Object.keys(provider.types).some(isValidProviderType)
  );
  const validProviderIds = validProviders
    .map((provider) => provider.id)
    .sort((a, b) => a - b);
  console.info("");
  console.info("Valid provider IDs: ", JSON.stringify(validProviderIds));
}

function getStats() {
  if (!program.opts().file) {
    console.warn(`Please specify a JSON movies file to read.`);
    return;
  }

  const movies = require(program.opts().file) as Movie[];

  const providersMap = getProviders(movies);

  printProviders(providersMap);
  console.info("");
}

getStats();
